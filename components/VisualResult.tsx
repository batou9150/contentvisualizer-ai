import React, { useState, useRef, useEffect } from 'react';
import { GoogleDriveIcon, DownloadIcon, ExpandIcon, ChevronsDownUpIcon } from './Icons';

interface VisualResultProps {
  url: string | null;
  driveUrl?: string | null;
  onImprove?: (instruction: string) => void;
  isImproving?: boolean;
}

const VisualResult: React.FC<VisualResultProps> = ({ url, driveUrl, onImprove, isImproving }) => {
  const [showImproveMenu, setShowImproveMenu] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowImproveMenu(false);
      }
    };
    if (showImproveMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImproveMenu]);

  const handleImprove = (instruction: string) => {
    setShowImproveMenu(false);
    setCustomPrompt('');
    onImprove?.(instruction);
  };

  if (!url) return null;
  return (
    <div className="mt-6">
      <div className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {isImproving && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img src={url} alt="AI Visual" className="w-full h-auto" />
      </div>
      <div className="flex items-center gap-3 mt-3">
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <GoogleDriveIcon className="w-4 h-4" />
            Open in Drive
          </a>
        )}
        <a
          href={url}
          download={`slide_${Math.random().toString(36).substring(2, 9)}`}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <DownloadIcon className="w-4 h-4" />
          Download
        </a>
        {onImprove && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowImproveMenu(!showImproveMenu)}
              disabled={isImproving}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
            >
              ✨ Improve
            </button>
            {showImproveMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                <div className="p-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPrompt.trim()) {
                        handleImprove(customPrompt.trim());
                      }
                    }}
                    placeholder="Modify with a prompt"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleImprove('Make the image more detailed with richer visual elements')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExpandIcon className="w-3.5 h-3.5 inline-block mr-1.5" />Elaborate
                  </button>
                  <button
                    onClick={() => handleImprove('Simplify the image with a cleaner, more minimal design')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronsDownUpIcon className="w-3.5 h-3.5 inline-block mr-1.5" />Clean Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualResult;
