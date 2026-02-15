import React from 'react';
import FormattedSummary from './FormattedSummary';
import VisualResult from './VisualResult';
import { ImageIcon } from './Icons';
import { ProcessedData } from '../types';

interface ExecutiveSummaryProps {
  data: ProcessedData;
  summaryImageUrl: string | null;
  summaryDriveUrl: string | null;
  isGeneratingSummaryImage: boolean;
  onGenerateImage: () => void;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  data,
  summaryImageUrl,
  summaryDriveUrl,
  isGeneratingSummaryImage,
  onGenerateImage
}) => {
  return (
    <section className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Executive Summary</h2>
        </div>
        <button
          onClick={onGenerateImage}
          disabled={isGeneratingSummaryImage}
          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isGeneratingSummaryImage ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
          Generate Slide Visual
        </button>
      </div>
      <FormattedSummary text={data.summary} />
      <VisualResult url={summaryImageUrl} driveUrl={summaryDriveUrl} />
      {data.sources && data.sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
          {data.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-gray-50 dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-all font-medium">{s.title || 'Source'}</a>)}
        </div>
      )}
    </section>
  );
};

export default ExecutiveSummary;
