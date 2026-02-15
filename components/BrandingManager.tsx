import React, { useState, useRef, useEffect } from 'react';
import { Branding } from '../types';
import { GeminiService } from '../services/geminiService';
import { EditIcon, DeleteIcon, PlusIcon, PenIcon, StarIcon } from './Icons';

interface BrandingManagerProps {
  brandings: Branding[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChangeBrandings: (brandings: Branding[]) => void;
}

const BrandingManager: React.FC<BrandingManagerProps> = ({
  brandings,
  selectedId,
  onSelect,
  onChangeBrandings
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranding, setEditingBranding] = useState<Branding | null>(null);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  
  // Controlled inputs
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setName(editingBranding?.name || '');
      setPrompt(editingBranding?.prompt || '');
    }
  }, [isModalOpen, editingBranding]);

  const getSelectedBranding = () => {
    return brandings.find(b => b.id === selectedId) || brandings[0];
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBranding) {
      const updated = brandings.map(b => b.id === editingBranding.id ? { ...b, name, prompt } : b);
      onChangeBrandings(updated);
      setEditingBranding(null);
    } else {
      const newBranding: Branding = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        prompt
      };
      onChangeBrandings([...brandings, newBranding]);
      onSelect(newBranding.id);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (brandings.length <= 1) return;
    const filtered = brandings.filter(b => b.id !== id);
    onChangeBrandings(filtered);
    if (selectedId === id) {
      onSelect(filtered[0].id);
    }
  };

  const handleImprovePrompt = async () => {
    if (!name.trim() && !prompt.trim()) return;

    setIsImprovingPrompt(true);
    try {
      const improved = await GeminiService.improveVisualPrompt(prompt, name);
      setPrompt(improved);
    } catch (err) {
      console.error("Failed to improve prompt:", err);
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const selectedBranding = getSelectedBranding();

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${isDropdownOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-[#0055d2] dark:border-blue-600 hover:bg-gray-50'}`}
          style={{ borderWidth: '1.5px' }}
        >
          <span className="text-sm font-bold tracking-wide text-gray-500 dark:text-gray-400">
            Branding: <span className="text-indigo-600 dark:text-indigo-400 ml-1 uppercase">{selectedBranding?.name}</span>
          </span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Branding Styles</h2>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {brandings.map((b, index) => (
                <div
                  key={b.id}
                  className={`group relative transition-all p-4 flex items-center justify-between cursor-pointer ${index !== brandings.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''} ${selectedId === b.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                  <div
                    onClick={() => { onSelect(b.id); setIsDropdownOpen(false); }}
                    className="flex-1 overflow-hidden"
                  >
                    <p className={`font-semibold text-sm truncate uppercase ${selectedId === b.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {b.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingBranding(b); setIsModalOpen(true); setIsDropdownOpen(false); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    {brandings.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setEditingBranding(null); setIsModalOpen(true); setIsDropdownOpen(false); }}
                className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                New branding
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <form onSubmit={handleSave} className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl shadow-2xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {editingBranding ? 'Edit Branding' : 'New Branding Style'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Branding Name</label>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                        <PenIcon className="w-4 h-4" />
                        <div className="absolute top-1/2 -translate-y-2 -left-1">
                          <StarIcon className="w-2.5 h-2.5 text-indigo-500" />
                        </div>
                      </div>
                    )}
                    Improve
                  </button>
                </div>
                <textarea
                  name="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
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
                onClick={() => setIsModalOpen(false)}
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
    </>
  );
};

export default BrandingManager;
