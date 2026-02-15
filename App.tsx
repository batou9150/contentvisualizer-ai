import React, { useState, useEffect } from 'react';
import { AppState, ImageSize, InputMode, Branding } from './types';
import { GeminiService } from './services/geminiService';
import { INITIAL_BRANDINGS, DEFAULT_BRANDING } from './constants';
import { EmptyStateIcon } from './components/Icons';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ExecutiveSummary from './components/ExecutiveSummary';
import MindmapVisualizer from './components/MindmapVisualizer';

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
    };
  });

  useEffect(() => {
    localStorage.setItem('brandings', JSON.stringify(state.brandings));
    localStorage.setItem('selectedBrandingId', state.selectedBrandingId);
  }, [state.brandings, state.selectedBrandingId]);

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

  return (
    <div className="min-h-screen pb-20 dark:bg-[#0f172a] transition-colors duration-300 text-gray-900 dark:text-slate-100">
      <Header
        brandings={state.brandings}
        selectedBrandingId={state.selectedBrandingId}
        onSelectBranding={(id) => setState(prev => ({ ...prev, selectedBrandingId: id }))}
        onChangeBrandings={(brandings) => setState(prev => ({ ...prev, brandings }))}
        imageSize={state.imageSize}
        setImageSize={(size) => setState(prev => ({ ...prev, imageSize: size }))}
      />

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        <InputForm
          inputMode={state.inputMode}
          setInputMode={(mode) => setState(prev => ({ ...prev, inputMode: mode }))}
          url={state.url}
          setUrl={(url) => setState(prev => ({ ...prev, url }))}
          textContent={state.textContent}
          setTextContent={(text) => setState(prev => ({ ...prev, textContent: text }))}
          imagePreview={state.imagePreview}
          imageData={state.imageData}
          onImageUpload={handleImageUpload}
          loading={state.loading}
          onSubmit={handleProcessInput}
          error={state.error}
        />

        {(state.data) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExecutiveSummary
              data={state.data}
              summaryImageUrl={state.summaryImageUrl}
              isGeneratingSummaryImage={state.isGeneratingSummaryImage}
              onGenerateImage={handleGenerateSummaryImage}
            />

            <MindmapVisualizer
              data={state.data}
              mindmapImageUrl={state.mindmapImageUrl}
              isGeneratingMindmapImage={state.isGeneratingMindmapImage}
              onGenerateImage={handleGenerateMindmapImage}
              showRawMermaid={state.showRawMermaid}
              setShowRawMermaid={(show) => setState(prev => ({ ...prev, showRawMermaid: show }))}
            />
          </div>
        )}

        {!state.data && !state.loading && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white/50 dark:bg-gray-800/30">
            <EmptyStateIcon className="w-12 h-12" />
            <p className="text-sm font-medium">Analyze content to start visualizing</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
