import React from 'react';
import MermaidRenderer from './MermaidRenderer';
import VisualResult from './VisualResult';
import { ImageIcon } from './Icons';
import { ProcessedData } from '../types';

interface MindmapVisualizerProps {
  data: ProcessedData;
  mindmapImageUrl: string | null;
  isGeneratingMindmapImage: boolean;
  onGenerateImage: () => void;
  showRawMermaid: boolean;
  setShowRawMermaid: (show: boolean) => void;
}

const MindmapVisualizer: React.FC<MindmapVisualizerProps> = ({
  data,
  mindmapImageUrl,
  isGeneratingMindmapImage,
  onGenerateImage,
  showRawMermaid,
  setShowRawMermaid
}) => {
  return (
    <section className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">AI Mindmap</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRawMermaid(!showRawMermaid)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            {showRawMermaid ? <>Hide Code</> : <>View Code</>}
          </button>
          <button
            onClick={onGenerateImage}
            disabled={isGeneratingMindmapImage}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isGeneratingMindmapImage ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            Generate Slide Visual
          </button>
        </div>
      </div>
      {showRawMermaid ? (
        <div className="bg-gray-900 text-indigo-300 p-6 rounded-xl border border-gray-800 shadow-inner overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre mb-6">{data.mermaidCode}</div>
      ) : (
        <MermaidRenderer chart={data.mermaidCode} />
      )}
      <VisualResult url={mindmapImageUrl} />
    </section>
  );
};

export default MindmapVisualizer;
