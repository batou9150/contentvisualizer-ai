import React, { useState, useRef, useEffect } from 'react';
import BrandingManager from './BrandingManager';
import HistoryDrawer from './HistoryDrawer';
import { HistoryIcon } from './Icons';
import { Branding, ImageSize, AspectRatio } from '../types';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/useAuth';

interface HeaderProps {
  brandings: Branding[];
  selectedBrandingId: string;
  onSelectBranding: (id: string) => void;
  onChangeBrandings: (brandings: Branding[]) => void;
  imageSize: ImageSize;
  setImageSize: (size: ImageSize) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
}

const Header: React.FC<HeaderProps> = ({
  brandings,
  selectedBrandingId,
  onSelectBranding,
  onChangeBrandings,
  imageSize,
  setImageSize,
  aspectRatio,
  setAspectRatio,
}) => {

  const { user, login, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      login(codeResponse);
    },
    onError: (error) => console.log('Login Failed:', error),
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/drive',
  });

  return (
    <header className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] text-white text-xl">
            🖼
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Content Visualizer <span className="text-indigo-600">AI</span></h1>
        </div>

        {!user ? (
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

        ) : (
          <div className="flex items-center gap-4">
            <BrandingManager
              brandings={brandings}
              selectedId={selectedBrandingId}
              onSelect={onSelectBranding}
              onChangeBrandings={onChangeBrandings}
            />

            <div className="relative flex items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as ImageSize)}
                  className="appearance-none bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-3 pr-8 py-1.5 cursor-pointer"
                >
                  {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative flex items-center">
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="appearance-none bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-3 pr-8 py-1.5 cursor-pointer"
                >
                  {(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as AspectRatio[]).map((ar) => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="History"
            >
              <HistoryIcon className="w-5 h-5" />
            </button>

            <div className="relative" ref={dropdownRef}>
              {user.picture && (
                <button
                  onClick={() => setShowLogout(!showLogout)}
                  className="flex items-center focus:outline-none"
                >
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-600 hover:border-indigo-500 transition-colors" />
                </button>
              )}

              {showLogout && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowLogout(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <HistoryDrawer isOpen={showHistory} onClose={() => setShowHistory(false)} />
      </div>
    </header>
  );
};

export default Header;
