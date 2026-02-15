import React from 'react';
import { GoogleDriveIcon } from './Icons';

interface VisualResultProps {
  url: string | null;
  driveUrl?: string | null;
}

const VisualResult: React.FC<VisualResultProps> = ({ url, driveUrl }) => {
  if (!url) return null;
  return (
    <div className="mt-6 relative group overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <img src={url} alt="AI Visual" className="w-full h-auto" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:scale-105 hover:bg-indigo-700 transition-transform shadow-xl flex items-center gap-2"
          >
            <GoogleDriveIcon className="w-5 h-5" />
            Open in Drive
          </a>
        )}
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

export default VisualResult;
