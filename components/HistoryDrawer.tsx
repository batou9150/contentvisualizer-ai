import React, { useEffect, useState } from 'react';
import { CloseIcon, DeleteIcon } from './Icons';
import { useAuth } from '../contexts/useAuth';
import { DriveService } from '../services/driveService';
import { DRIVE_FOLDER_NAME } from '../constants';

interface HistoryItem {
  id: string;
  thumbnailUrl: string;
  webViewLink: string;
  title: string;
  timestamp: string;
  isDeleting?: boolean;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !token?.access_token) return;

      setLoading(true);
      try {
        const folderId = await DriveService.findOrCreateFolder(DRIVE_FOLDER_NAME, token.access_token);
        const files = await DriveService.listFiles(folderId, token.access_token);

        const items: HistoryItem[] = files.map((file: any) => ({
          id: file.id,
          thumbnailUrl: file.thumbnailLink,
          webViewLink: file.webViewLink,
          title: file.name.replace('.png', '').replace('.jpg', '').replace(/_/g, ' '),
          timestamp: new Date(file.createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }));

        setHistory(items);
      } catch (error: any) {
        console.error('Failed to fetch history:', error);
        if (error.message.includes('401') || error.message.includes('invalid authentication')) {
          alert("Your session has expired. Please log out and log in again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, token]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token?.access_token) return;

    setHistory(prev => prev.map(item => item.id === id ? { ...item, isDeleting: true } : item));

    try {
      await DriveService.deleteFile(id, token.access_token);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete the file. Please try again.');
      setHistory(prev => prev.map(item => item.id === id ? { ...item, isDeleting: false } : item));
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[800px] bg-white dark:bg-[#0f172a] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generation History</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
              No history found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {history.map((item) => (
                <a
                  key={item.id}
                  href={item.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex flex-col gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-gray-800 border border-transparent hover:border-indigo-100 dark:hover:border-gray-700 cursor-pointer transition-all duration-200 ${item.isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl.replace('=s220', '=s1000')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-xs">No Img</span>
                      </div>
                    )}
                  </div>

                  {/* Info Row */}
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-indigo-400 transition-colors"></span>
                        {item.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={item.isDeleting}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete from history"
                    >
                      {item.isDeleting ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <DeleteIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;
