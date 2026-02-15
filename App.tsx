import React from 'react';
import { EmptyStateIcon } from './components/Icons';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ExecutiveSummary from './components/ExecutiveSummary';
import MindmapVisualizer from './components/MindmapVisualizer';
import { useContentAnalysis } from './hooks/useContentAnalysis';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './contexts/useAuth';

const App: React.FC = () => {
  const {
    state,
    setState,
    handleImageUpload,
    handleProcessInput,
    handleGenerateMindmapImage,
    handleGenerateSummaryImage
  } = useContentAnalysis();

  const { user, login, logout } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      login(codeResponse);
    },
    onError: (error) => console.log('Login Failed:', error),
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/drive',
  });

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

      {!user ? (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign in required</h2>
            <p className="text-slate-600 mb-8">
              Please sign in to use this app.
            </p>

            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => googleLogin()}
                className="flex items-center justify-center space-x-2 w-[220px] bg-white text-gray-700 hover:bg-gray-100 font-medium py-2 px-4 rounded-full transition-colors duration-200 shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default App;
