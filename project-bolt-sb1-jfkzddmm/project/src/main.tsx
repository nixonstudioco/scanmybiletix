import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initWebViewCompatibility } from './utils/webviewCompatibility';
import { pwaService } from './services/pwaService';
import { setPrintAgentToken } from './lib/printAgent';

// Preload sound effects
import './services/soundService';

// Initialize WebView compatibility before React
initWebViewCompatibility();

// Initialize print agent token
setPrintAgentToken('<<fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27>>');

// Enhanced PWA initialization
if ('serviceWorker' in navigator && 'PushManager' in window && pwaService.isServiceWorkerSupported()) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates immediately
      await registration.update();
      
      // Listen for new service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New service worker found');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, update available');
              // Notify user about update
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);