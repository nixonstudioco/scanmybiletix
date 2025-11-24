import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Download, Smartphone } from 'lucide-react';
import { pwaService } from '../../services/pwaService';

const PWAUpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Register for update notifications
    pwaService.onUpdateAvailable((registration) => {
      console.log('Update available, showing notification');
      setShowUpdatePrompt(true);
    });

    // Check if there's already an update available
    if (pwaService.hasUpdateAvailable()) {
      setShowUpdatePrompt(true);
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      await pwaService.applyUpdate();
      
      // Show loading state briefly
      setTimeout(() => {
        // Reload the page to get the new version
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error applying update:', error);
      setIsUpdating(false);
      // Still try to reload in case of error
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    localStorage.setItem('pwa-update-dismissed', Date.now().toString());
  };

  const handleRemindLater = () => {
    setShowUpdatePrompt(false);
    // Show again in 1 hour
    setTimeout(() => {
      setShowUpdatePrompt(true);
    }, 60 * 60 * 1000);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-xl border border-blue-500 max-w-sm z-50 animate-bounce-in">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-blue-200" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1">Update Available!</h3>
          <p className="text-xs text-blue-100 mb-3">
            A new version of the app is available with the latest features and improvements.
          </p>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center justify-center space-x-2 bg-white text-blue-700 px-3 py-2 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors shadow-md disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-blue-700 border-t-transparent rounded-full"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  <span>Update Now</span>
                </>
              )}
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleRemindLater}
                disabled={isUpdating}
                className="flex-1 text-blue-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-blue-800 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="flex-1 text-blue-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-blue-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          disabled={isUpdating}
          className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;