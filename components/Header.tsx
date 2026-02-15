import React from 'react';
import BrandingManager from './BrandingManager';
import { Branding, ImageSize } from '../types';

interface HeaderProps {
  brandings: Branding[];
  selectedBrandingId: string;
  onSelectBranding: (id: string) => void;
  onChangeBrandings: (brandings: Branding[]) => void;
  imageSize: ImageSize;
  setImageSize: (size: ImageSize) => void;
}

const Header: React.FC<HeaderProps> = ({
  brandings,
  selectedBrandingId,
  onSelectBranding,
  onChangeBrandings,
  imageSize,
  setImageSize,
}) => {
  return (
    <header className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] text-white text-xl">
            🖼
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Content Visualizer <span className="text-indigo-600">AI</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <BrandingManager
            brandings={brandings}
            selectedId={selectedBrandingId}
            onSelect={onSelectBranding}
            onChangeBrandings={onChangeBrandings}
          />

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
              <button key={sz} onClick={() => setImageSize(sz)} className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${imageSize === sz ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{sz}</button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
