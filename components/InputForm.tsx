import React from 'react';
import { InputMode } from '../types';
import { LightningIcon, ImageIcon } from './Icons';

interface InputFormProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  url: string;
  setUrl: (url: string) => void;
  textContent: string;
  setTextContent: (text: string) => void;
  imagePreview: string | null;
  fileData: { data: string; mimeType: string } | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
}

const InputForm: React.FC<InputFormProps> = ({
  inputMode,
  setInputMode,
  url,
  setUrl,
  textContent,
  setTextContent,
  imagePreview,
  fileData,
  onFileUpload,
  loading,
  onSubmit,
  error
}) => {
  return (
    <div className="bg-white dark:bg-[#1e293b] p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800 p-1">
        <button onClick={() => setInputMode('url')} className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${inputMode === 'url' ? 'bg-white dark:bg-[#1e293b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Website URL</button>
        <button onClick={() => setInputMode('text')} className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${inputMode === 'text' ? 'bg-white dark:bg-[#1e293b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Direct Text</button>
        <button onClick={() => setInputMode('file')} className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${inputMode === 'file' ? 'bg-white dark:bg-[#1e293b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>From File</button>
      </div>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">
          {inputMode === 'url' ? 'Paste Article URL' : inputMode === 'text' ? 'Paste Article Content' : 'Upload Content File'}
        </h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {inputMode === 'url' ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://example.com/blog-post"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-[#334155] text-gray-900 dark:text-white placeholder:text-gray-400"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button disabled={loading} type="submit" className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all min-w-[52px] h-[52px] flex items-center justify-center shadow-[0_4px_20px_rgba(79,70,229,0.5)]">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LightningIcon className="w-6 h-6" />}
              </button>
            </div>
          ) : inputMode === 'text' ? (
            <>
              <textarea
                placeholder="Paste content here..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none bg-white dark:bg-[#334155] text-gray-900 dark:text-white placeholder:text-gray-400"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3">
                <button disabled={loading} type="submit" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(79,70,229,0.5)]">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LightningIcon className="w-5 h-5" />Analyze Text</>}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative group border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-center cursor-pointer">
                <input type="file" accept="image/*,.pdf" onChange={onFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {imagePreview ? (
                  <div className="flex flex-col items-center">
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg shadow-sm mb-3" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click or drag to change file</p>
                  </div>
                ) : fileData ? (
                   <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-2xl">📄</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">File selected</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click or drag to change file</p>
                   </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" strokeWidth={1} />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Select a file to analyze</p>
                    <p className="text-xs text-gray-400 mt-1">Images or PDF</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button disabled={loading || !fileData} type="submit" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(79,70,229,0.5)]">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LightningIcon className="w-5 h-5" />Analyze File</>}
                </button>
              </div>
            </div>
          )}
        </form>
        {error && <p className="mt-3 text-red-500 text-sm font-medium">Error: {error}</p>}
      </div>
    </div>
  );
};

export default InputForm;
