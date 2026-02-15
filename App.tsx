
import React, { useState, useEffect, useRef } from 'react';
import { AppState, ImageSize, InputMode, Branding } from './types';
import { GeminiService } from './services/geminiService';
import MermaidRenderer from './components/MermaidRenderer';

const DEFAULT_BRANDING: Branding = {
  id: 'default',
  name: 'CORPORATE',
  prompt: `Create a modern, clean corporate infographic slide visual on a pure white background. The aesthetic is tech-oriented, professional, and airy. The color palette must strictly use vibrant periwinkle/violet-blue for main titles and diagram outlines, a deep navy blue for solid accent blocks, and dark gray for body text. Use a clean, geometric sans-serif typography throughout.`
};

const CHIBI_BRANDING: Branding = {
  id: 'chibi-style',
  name: 'CHIBI',
  prompt: 'Create an infographic with Chibi-style Corporate Sketchnoting'
};

const AGENTIC_BRANDING: Branding = {
  id: 'agentic-style',
  name: 'AGENTIC',
  prompt: 'A futuristic 3D abstract composition representing Agentic AI. Sharp isometric view. A glowing electric violet node moves along a crystalline cyan pathway, connecting floating glass squares that represent data tasks. Deep navy background. Clean vectors, high-tech, kinetic energy, depth of field, 8k resolution, precise lighting.'
};

const EDUCATIONAL_BRANDING: Branding = {
  id: 'educational-style',
  name: 'EDUCATIONAL',
  prompt: 'An educational whiteboard-style illustration. The layout is a step-by-step vertical guide numbered. Features cute, thick-lined doodles and schematic drawings. specific visual focus on [Specific Items, e.g., plants and sun]. Bright primary colors against a clean white background. playful and clear.'
};

const INITIAL_BRANDINGS: Branding[] = [DEFAULT_BRANDING, CHIBI_BRANDING, AGENTIC_BRANDING, EDUCATIONAL_BRANDING];

const FormattedSummary: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  const parseInline = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-gray-900 dark:text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const renderedHeaderContent = parseInline(content);
      if (level === 1) elements.push(<h1 key={i} className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{renderedHeaderContent}</h1>);
      else if (level === 2) elements.push(<h2 key={i} className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{renderedHeaderContent}</h2>);
      else if (level === 3) elements.push(<h3 key={i} className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-6 mb-2">{renderedHeaderContent}</h3>);
      else if (level === 4) elements.push(<h4 key={i} className="text-lg font-bold text-gray-800 dark:text-slate-200 mt-4 mb-2 border-l-4 border-indigo-200 dark:border-indigo-900 pl-3">{renderedHeaderContent}</h4>);
      else elements.push(<h5 key={i} className="text-base font-bold text-gray-700 dark:text-slate-400 mt-3 mb-1 uppercase tracking-wide">{renderedHeaderContent}</h5>);
      i++;
      continue;
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const hasDivider = tableLines[1].includes('---');
        const startIdx = hasDivider ? 2 : 1;
        const getCells = (row: string) => row.split('|').map(c => c.trim()).filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || (idx === 0 && c !== "") || (idx === arr.length - 1 && c !== ""));
        const headers = getCells(tableLines[0]);
        const bodyRows = tableLines.slice(startIdx).map(row => getCells(row));
        elements.push(
          <div key={`table-${i}`} className="my-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {headers.map((h, hidx) => (
                    <th key={hidx} className="px-4 py-3 text-left font-bold text-gray-900 dark:text-white uppercase tracking-wider">{parseInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-gray-800">
                {bodyRows.map((row, ridx) => (
                  <tr key={ridx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="px-4 py-3 text-gray-600 dark:text-slate-300 whitespace-nowrap">{parseInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    const isBullet = line.startsWith('* ') || line.startsWith('- ');
    if (isBullet) {
      const content = line.slice(2);
      elements.push(
        <div key={i} className="flex gap-3 pl-2 group">
          <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-1 flex-shrink-0 transition-transform group-hover:scale-125">•</span>
          <span className="text-gray-600 dark:text-slate-300 leading-relaxed">{parseInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    elements.push(<p key={i} className="text-gray-600 dark:text-slate-300 leading-relaxed">{parseInline(line)}</p>);
    i++;
  }
  return <div className="space-y-4">{elements}</div>;
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedBrandings = localStorage.getItem('brandings');
    const savedSelectedId = localStorage.getItem('selectedBrandingId');
    const brandings = savedBrandings ? JSON.parse(savedBrandings) : INITIAL_BRANDINGS;
    return {
      url: '',
      textContent: '',
      imagePreview: null,
      imageData: null,
      inputMode: 'url',
      loading: false,
      error: null,
      data: null,
      summaryImageUrl: null,
      mindmapImageUrl: null,
      isGeneratingSummaryImage: false,
      isGeneratingMindmapImage: false,
      imageSize: '2K',
      showRawMermaid: false,
      brandings,
      selectedBrandingId: savedSelectedId || DEFAULT_BRANDING.id,
      isBrandingModalOpen: false,
      isBrandingFormOpen: false,
      editingBranding: null,
    };
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const promptTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const brandingNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('brandings', JSON.stringify(state.brandings));
    localStorage.setItem('selectedBrandingId', state.selectedBrandingId);
  }, [state.brandings, state.selectedBrandingId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedBranding = () => {
    return state.brandings.find(b => b.id === state.selectedBrandingId) || state.brandings[0] || DEFAULT_BRANDING;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setState(prev => ({
          ...prev,
          imagePreview: reader.result as string,
          imageData: { data: base64, mimeType: file.type }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const { inputMode, url, textContent, imageData } = state;
    const input = inputMode === 'url' ? url : textContent;

    if (inputMode === 'image' && !imageData) return;
    if (inputMode !== 'image' && !input) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      data: null,
      summaryImageUrl: null,
      mindmapImageUrl: null
    }));

    try {
      const result = await GeminiService.processContent(input, inputMode, imageData || undefined);
      setState(prev => ({ ...prev, data: result, loading: false }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        error: `Failed to analyze. Please check your input.`,
        loading: false
      }));
    }
  };

  const handleGenerateMindmapImage = async () => {
    if (!state.data) return;
    try {
      setState(prev => ({ ...prev, isGeneratingMindmapImage: true, error: null }));
      const branding = getSelectedBranding();
      const imageUrl = await GeminiService.generateInfographic(state.data.mermaidCode, state.imageSize, branding.prompt);
      setState(prev => ({ ...prev, mindmapImageUrl: imageUrl, isGeneratingMindmapImage: false }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Image generation failed.", isGeneratingMindmapImage: false }));
    }
  };

  const handleGenerateSummaryImage = async () => {
    if (!state.data) return;
    try {
      setState(prev => ({ ...prev, isGeneratingSummaryImage: true, error: null }));
      const branding = getSelectedBranding();
      const imageUrl = await GeminiService.generateDirectInfographic(state.data.summary, state.imageSize, branding.prompt);
      setState(prev => ({ ...prev, summaryImageUrl: imageUrl, isGeneratingSummaryImage: false }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Image generation failed.", isGeneratingSummaryImage: false }));
    }
  };

  const saveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const prompt = formData.get('prompt') as string;

    if (state.editingBranding) {
      const updated = state.brandings.map(b => b.id === state.editingBranding?.id ? { ...b, name, prompt } : b);
      setState(prev => ({ ...prev, brandings: updated, isBrandingFormOpen: false, editingBranding: null }));
    } else {
      const newBranding: Branding = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        prompt
      };
      setState(prev => ({ ...prev, brandings: [...prev.brandings, newBranding], isBrandingFormOpen: false, selectedBrandingId: newBranding.id }));
    }
  };

  const handleImprovePrompt = async () => {
    const nameVal = brandingNameRef.current?.value || "";
    const promptVal = promptTextAreaRef.current?.value || "";

    // Allow improvement if either name or prompt is present
    if (!nameVal.trim() && !promptVal.trim()) return;

    setIsImprovingPrompt(true);
    try {
      const improved = await GeminiService.improveVisualPrompt(promptVal, nameVal);
      if (promptTextAreaRef.current) {
        promptTextAreaRef.current.value = improved;
      }
    } catch (err) {
      console.error("Failed to improve prompt:", err);
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const deleteBranding = (id: string) => {
    if (state.brandings.length <= 1) return;
    setState(prev => {
      const filtered = prev.brandings.filter(b => b.id !== id);
      const nextId = prev.selectedBrandingId === id ? filtered[0].id : prev.selectedBrandingId;
      return { ...prev, brandings: filtered, selectedBrandingId: nextId };
    });
  };

  const VisualResult: React.FC<{ url: string | null }> = ({ url }) => {
    if (!url) return null;
    return (
      <div className="mt-6 relative group overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <img src={url} alt="AI Visual" className="w-full h-auto" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <a
            href={url}
            download={`slide_${Math.random().toString(36).substring(2, 9)}.jpg`}
            className="px-6 py-2 bg-white text-gray-900 font-bold rounded-lg hover:scale-105 transition-transform shadow-xl"
          >
            Download
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 dark:bg-[#0f172a] transition-colors duration-300 text-gray-900 dark:text-slate-100">
      <header className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] text-white text-xl">
              🖼
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Content Visualizer <span className="text-indigo-600">AI</span></h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Branding Dropdown Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${isDropdownOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-[#0055d2] dark:border-blue-600 hover:bg-gray-50'}`}
                style={{ borderWidth: '1.5px' }}
              >
                <span className="text-sm font-bold tracking-wide text-gray-500 dark:text-gray-400">
                  Branding: <span className="text-indigo-600 dark:text-indigo-400 ml-1 uppercase">{getSelectedBranding().name}</span>
                </span>
              </button>

              {/* Branding Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Branding Styles</h2>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {state.brandings.map((b, index) => (
                      <div
                        key={b.id}
                        className={`group relative transition-all p-4 flex items-center justify-between cursor-pointer ${index !== state.brandings.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''} ${state.selectedBrandingId === b.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                      >
                        <div
                          onClick={() => { setState(prev => ({ ...prev, selectedBrandingId: b.id })); setIsDropdownOpen(false); }}
                          className="flex-1 overflow-hidden"
                        >
                          <p className={`font-semibold text-sm truncate uppercase ${state.selectedBrandingId === b.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {b.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setState(prev => ({ ...prev, editingBranding: b, isBrandingFormOpen: true })); setIsDropdownOpen(false); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          {state.brandings.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteBranding(b.id); }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => { setState(prev => ({ ...prev, isBrandingFormOpen: true, editingBranding: null })); setIsDropdownOpen(false); }}
                      className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      New branding
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                <button key={sz} onClick={() => setState(prev => ({ ...prev, imageSize: sz }))} className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${state.imageSize === sz ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{sz}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Add/Edit Branding Modal */}
      {state.isBrandingFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <form onSubmit={saveBranding} className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl shadow-2xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {state.editingBranding ? 'Edit Branding' : 'New Branding Style'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Branding Name</label>
                <input
                  name="name"
                  ref={brandingNameRef}
                  defaultValue={state.editingBranding?.name}
                  required
                  placeholder="e.g., Corporate Dark, Modern Glass"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white bg-white dark:bg-[#334155] placeholder:text-gray-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Visual Prompt</label>
                  <button
                    type="button"
                    onClick={handleImprovePrompt}
                    disabled={isImprovingPrompt}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    {isImprovingPrompt ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <div className="absolute top-1/2 -translate-y-2 -left-1">
                          <svg className="w-2.5 h-2.5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    Improve
                  </button>
                </div>
                <textarea
                  name="prompt"
                  ref={promptTextAreaRef}
                  defaultValue={state.editingBranding?.prompt}
                  required
                  rows={6}
                  placeholder="Describe the aesthetic, colors, and layout..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-[#334155] placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, isBrandingFormOpen: false }))}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-[0_4px_20px_rgba(79,70,229,0.5)]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        <div className="bg-white dark:bg-[#1e293b] p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800 p-1">
            <button onClick={() => setState(prev => ({ ...prev, inputMode: 'url' }))} className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${state.inputMode === 'url' ? 'bg-white dark:bg-[#1e293b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Website URL</button>
            <button onClick={() => setState(prev => ({ ...prev, inputMode: 'text' }))} className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${state.inputMode === 'text' ? 'bg-white dark:bg-[#1e293b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Direct Text</button>
            <button onClick={() => setState(prev => ({ ...prev, inputMode: 'image' }))} className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${state.inputMode === 'image' ? 'bg-white dark:bg-[#1e293b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>From Image</button>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {state.inputMode === 'url' ? 'Paste Article URL' : state.inputMode === 'text' ? 'Paste Article Content' : 'Upload Content Image'}
            </h2>
            <form onSubmit={handleProcessInput} className="flex flex-col gap-4">
              {state.inputMode === 'url' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/blog-post"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-[#334155] text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={state.url}
                    onChange={(e) => setState(prev => ({ ...prev, url: e.target.value }))}
                    required
                  />
                  <button disabled={state.loading} type="submit" className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all min-w-[52px] h-[52px] flex items-center justify-center shadow-[0_4px_20px_rgba(79,70,229,0.5)]">
                    {state.loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  </button>
                </div>
              ) : state.inputMode === 'text' ? (
                <>
                  <textarea
                    placeholder="Paste content here..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none bg-white dark:bg-[#334155] text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={state.textContent}
                    onChange={(e) => setState(prev => ({ ...prev, textContent: e.target.value }))}
                    required
                  />
                  <div className="flex justify-end gap-3">
                    <button disabled={state.loading} type="submit" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(79,70,229,0.5)]">
                      {state.loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Analyze Text</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative group border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-center cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {state.imagePreview ? (
                      <div className="flex flex-col items-center">
                        <img src={state.imagePreview} alt="Preview" className="max-h-48 rounded-lg shadow-sm mb-3" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click or drag to change image</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-4">
                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Select an image to analyze</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG or WebP</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button disabled={state.loading || !state.imageData} type="submit" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(79,70,229,0.5)]">
                      {state.loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Analyze Image</>}
                    </button>
                  </div>
                </div>
              )}
            </form>
            {state.error && <p className="mt-3 text-red-500 text-sm font-medium">Error: {state.error}</p>}
          </div>
        </div>

        {(state.data) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Executive Summary Block */}
            <section className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Executive Summary</h2>
                </div>
                <button
                  onClick={handleGenerateSummaryImage}
                  disabled={state.isGeneratingSummaryImage}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {state.isGeneratingSummaryImage ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>}
                  Generate Slide Visual
                </button>
              </div>
              <FormattedSummary text={state.data.summary} />
              <VisualResult url={state.summaryImageUrl} />
              {state.data.sources && state.data.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                  {state.data.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-gray-50 dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-all font-medium">{s.title || 'Source'}</a>)}
                </div>
              )}
            </section>

            {/* AI Mindmap Block */}
            <section className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">AI Mindmap</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setState(prev => ({ ...prev, showRawMermaid: !prev.showRawMermaid }))} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    {state.showRawMermaid ? <>Hide Code</> : <>View Code</>}
                  </button>
                  <button
                    onClick={handleGenerateMindmapImage}
                    disabled={state.isGeneratingMindmapImage}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {state.isGeneratingMindmapImage ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>}
                    Generate Slide Visual
                  </button>
                </div>
              </div>
              {state.showRawMermaid ? (
                <div className="bg-gray-900 text-indigo-300 p-6 rounded-xl border border-gray-800 shadow-inner overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre mb-6">{state.data.mermaidCode}</div>
              ) : (
                <MermaidRenderer chart={state.data.mermaidCode} />
              )}
              <VisualResult url={state.mindmapImageUrl} />
            </section>
          </div>
        )}

        {!state.data && !state.loading && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white/50 dark:bg-gray-800/30">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-sm font-medium">Analyze content to start visualizing</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
