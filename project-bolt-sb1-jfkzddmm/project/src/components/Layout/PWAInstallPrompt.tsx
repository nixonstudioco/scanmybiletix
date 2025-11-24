import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Chrome } from 'lucide-react';
import { pwaService } from '../../services/pwaService';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Detect Chrome
    const chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    setIsChrome(chrome);

    // Check if app is already installed
    if (pwaService.isStandalone()) {
      return;
    }

    // Enhanced PWA detection
    const checkPWAInstallability = async () => {
      // Check if beforeinstallprompt is supported
      let canInstall = 'beforeinstallprompt' in window;
      
      // Check PWA criteria
      const criteria = pwaService.checkInstallability();
      
      console.log('PWA installability check:', {
        canInstall,
        criteria,
        isStandalone: pwaService.isStandalone(),
        userAgent: navigator.userAgent
      });
      
      // Force show prompt for testing on supported browsers
      if (!criteria.canInstall && (chrome || iOS)) {
        setTimeout(() => {
          setShowPrompt(true);
          setIsInstallable(true);
        }, 3000);
      }
    };
    
    checkPWAInstallability();
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setDeferredPrompt(event);
      setIsInstallable(true);
      
      // Show prompt after a delay if user hasn't dismissed it
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000); // Show after 5 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('App installed event fired');
      setShowPrompt(false);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Enhanced testing - show prompt if PWA criteria are met
    if (!iOS) {
      const testTimeout = setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        const criteria = pwaService.checkInstallability();
        
        console.log('PWA test timeout check:', {
          hasSeenPrompt,
          isStandalone: pwaService.isStandalone(),
          canInstall: criteria.canInstall,
          reasons: criteria.reasons
        });
        
        if (!hasSeenPrompt && !pwaService.isStandalone() && criteria.canInstall) {
          setShowPrompt(true);
          setIsInstallable(true);
        }
      }, 10000);

      return () => {
        clearTimeout(testTimeout);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for browsers that don't support the API
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Don't set the "seen" flag so it can show again
  };

  if (!showPrompt || pwaService.isStandalone()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-lg shadow-xl border border-primary-500 max-w-sm z-50 animate-bounce-in">
      <div className="flex items-start space-x-3">
        {isChrome ? (
          <Chrome className="h-6 w-6 text-primary-200 flex-shrink-0" />
        ) : (
          <Smartphone className="h-6 w-6 text-primary-200 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1">Install App</h3>
          <p className="text-xs text-primary-100 mb-3">
            {isIOS 
              ? 'Tap the share button in Safari and select "Add to Home Screen"'
              : 'Install QR Scan for quick access, offline features, and better performance'
            }
          </p>
          {!isIOS && (
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleInstall}
                className="flex items-center justify-center space-x-2 bg-white text-primary-700 px-3 py-2 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors shadow-md"
              >
                <Download className="h-3 w-3" />
                <span>Install Now</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={handleRemindLater}
                  className="flex-1 text-primary-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-primary-800 transition-colors"
                >
                  Remind Later
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 text-primary-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-primary-800 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          )}
          {isIOS && (
            <button
              onClick={handleDismiss}
              className="text-primary-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-primary-800 transition-colors"
            >
              Got it
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-primary-200 hover:text-white p-1 rounded hover:bg-primary-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;