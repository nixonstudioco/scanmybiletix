import React, { useState } from 'react';
import { FolderOpen, Upload, Check, AlertCircle, HardDrive } from 'lucide-react';
import { importTickets } from '../../services/csvService';
import { useAppContext } from '../../context/AppContext';
import { pwaService } from '../../services/pwaService';

const FileSystemUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { refreshTicketsCount, backendStatus } = useAppContext();
  const [supportsFileSystemAccess] = useState('showOpenFilePicker' in window);

  const handleFileSystemOpen = async () => {
    if (backendStatus !== 'connected') {
      setMessage({
        text: 'Not connected to Supabase. Please check your credentials and try again.',
        type: 'error'
      });
      return;
    }

    setIsUploading(true);
    setMessage({
      text: 'Opening file picker...',
      type: 'info'
    });

    try {
      const file = await pwaService.openFile(['.csv']);
      
      if (!file) {
        setIsUploading(false);
        setMessage(null);
        return;
      }

      setMessage({
        text: 'Processing file...',
        type: 'info'
      });

      const result = await importTickets(file);
      
      if (result.success) {
        setMessage({
          text: result.message,
          type: 'success'
        });
        refreshTicketsCount();
      } else {
        setMessage({
          text: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: `Error: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!supportsFileSystemAccess) {
    return null; // Don't show if not supported
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg shadow-xl p-6 mb-6 border border-blue-800/50">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
        <HardDrive className="h-6 w-6 mr-2 text-blue-400" />
        Advanced File Access
      </h2>
      
      <p className="text-blue-200 mb-4">
        Use enhanced file system access to browse and select CSV files from your device.
      </p>
      
      <button
        onClick={handleFileSystemOpen}
        disabled={isUploading || backendStatus !== 'connected'}
        className={`
          flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium
          transition-all duration-200 shadow-lg w-full
          ${isUploading || backendStatus !== 'connected'
            ? 'bg-dark-800 text-gray-400 cursor-not-allowed border border-dark-700'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border border-blue-500 transform hover:scale-105'
          }
        `}
      >
        {isUploading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FolderOpen className="h-5 w-5" />
            <span>Browse & Select CSV File</span>
          </>
        )}
      </button>
      
      {message && (
        <div className={`
          mt-4 p-4 rounded-lg flex items-start space-x-3 border
          ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border-green-800' : 
            message.type === 'error' ? 'bg-red-900/30 text-red-200 border-red-800' : 
            'bg-blue-900/30 text-blue-200 border-blue-800'}
        `}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Upload className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      <div className="mt-4 text-sm text-blue-300 bg-blue-950/50 p-3 rounded-lg">
        <p className="font-medium mb-2">Enhanced Features:</p>
        <ul className="space-y-1 text-xs">
          <li>• Direct access to your device's file system</li>
          <li>• Better file browsing experience</li>
          <li>• Secure file handling with modern browser APIs</li>
          <li>• Works offline when files are already on device</li>
        </ul>
      </div>
    </div>
  );
};

export default FileSystemUpload;