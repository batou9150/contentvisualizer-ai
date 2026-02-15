import React from 'react';

interface VisualResultProps {
  url: string | null;
}

const VisualResult: React.FC<VisualResultProps> = ({ url }) => {
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

export default VisualResult;
