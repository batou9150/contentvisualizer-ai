import React from 'react';
import { EmptyStateIcon } from './components/Icons';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ExecutiveSummary from './components/ExecutiveSummary';
import MindmapVisualizer from './components/MindmapVisualizer';
import { useContentAnalysis } from './hooks/useContentAnalysis';

const App: React.FC = () => {
  const {
    state,
    setState,
    handleImageUpload,
    handleProcessInput,
    handleGenerateMindmapImage,
    handleGenerateSummaryImage
  } = useContentAnalysis();

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
