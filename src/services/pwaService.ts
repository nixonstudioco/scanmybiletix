// PWA Service for enhanced functionality
class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;
  private updateAvailableCallbacks: Array<(registration: ServiceWorkerRegistration) => void> = [];

  async initialize(): Promise<void> {
    // Check if we're in an environment that supports Service Workers
    if (!this.isServiceWorkerSupported()) {
      console.log('Service Workers not supported in this environment');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered successfully');
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('New service worker version available');
        const newWorker = this.registration?.installing;
        if (newWorker) {
          // Automatically call skipWaiting on the new service worker
          newWorker.postMessage({ type: 'SKIP_WAITING' });
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('New service worker activated, reloading page');
              // Reload the page when new service worker is activated
              window.location.reload();
            }
          });
        }
      });

      // Listen for controller change and reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed, reloading page');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
          console.log('New version available:', event.data.version);
          this.notifyUpdateAvailable();
        }
      });
      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        console.log('PWA install prompt available');
      });

      // Listen for app installed
      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        this.deferredPrompt = null;
      });

    } catch (error) {
      // Handle specific environments that don't support Service Workers
      const errorMessage = (error as Error).message;
      if (this.isUnsupportedEnvironment(errorMessage)) {
        console.log('Service Workers not available in this environment, continuing without PWA features');
      } else {
        console.warn('Service Worker registration failed:', errorMessage);
      }
      // Don't throw the error, just log it and continue
    }
  }

  // Register callback for update notifications
  onUpdateAvailable(callback: (registration: ServiceWorkerRegistration) => void): void {
    this.updateAvailableCallbacks.push(callback);
  }

  // Notify all registered callbacks about update availability
  private notifyUpdateAvailable(): void {
    if (this.registration) {
      this.updateAvailableCallbacks.forEach(callback => {
        callback(this.registration!);
      });
    }
  }

  // Apply the pending update
  async applyUpdate(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to take control
      return new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          resolve();
        });
      });
    }
  }

  // Check if there's an update available
  hasUpdateAvailable(): boolean {
    return !!(this.registration && this.registration.waiting);
  }
  private isServiceWorkerSupported(): boolean {
    // Check if Service Workers are supported
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    // Check for known unsupported environments
    if (this.isStackBlitz() || this.isCodeSandbox()) {
      return false;
    }

    return true;
  }

  private isStackBlitz(): boolean {
    return window.location.hostname.includes('stackblitz') || 
           window.location.hostname.includes('webcontainer');
  }

  private isCodeSandbox(): boolean {
    return window.location.hostname.includes('codesandbox') ||
           window.location.hostname.includes('csb.app');
  }

  private isUnsupportedEnvironment(errorMessage: string): boolean {
    const unsupportedMessages = [
      'not yet supported on StackBlitz',
      'Service Workers are not available',
      'WebContainer',
      'not supported in this context'
    ];
    
    return unsupportedMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    );
  }

  async installPrompt(): Promise<boolean> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    }
    return false;
  }

  isInstallPromptAvailable(): boolean {
    return this.deferredPrompt !== null;
  }

  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      try {
        return await Notification.requestPermission();
      } catch (error) {
        console.warn('Notification permission request failed:', error);
        return 'denied';
      }
    }
    return 'denied';
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    try {
      if (this.registration && 'Notification' in window && Notification.permission === 'granted') {
        await this.registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          ...options
        });
      }
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }

  // File System Access API support
  async openFile(accepts: string[] = ['.csv']): Promise<File | null> {
    try {
      if ('showOpenFilePicker' in window) {
        // Use File System Access API if available
        const fileHandles = await (window as any).showOpenFilePicker({
          types: [{
            description: 'CSV files',
            accept: {
              'text/csv': accepts
            }
          }],
          multiple: false
        });
        
        if (fileHandles.length > 0) {
          return await fileHandles[0].getFile();
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('File System Access API failed, falling back to input:', error);
      }
    }
    
    return null;
  }

  async saveFile(blob: Blob, suggestedName: string): Promise<boolean> {
    try {
      if ('showSaveFilePicker' in window) {
        // Use File System Access API if available
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'CSV files',
            accept: {
              'text/csv': ['.csv']
            }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('File System Access API failed, falling back to download:', error);
      }
    }
    
    // Fallback to traditional download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return false;
  }

  // Wake Lock API to prevent screen from sleeping during scanning
  private wakeLock: any = null;

  async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Screen wake lock acquired');
        return true;
      }
    } catch (error) {
      console.warn('Wake lock failed:', error);
    }
    return false;
  }

  async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLock) {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Screen wake lock released');
      }
    } catch (error) {
      console.warn('Wake lock release failed:', error);
    }
  }

  // Share API support
  async shareData(data: { title?: string; text?: string; url?: string; files?: File[] }): Promise<boolean> {
    try {
      if ('share' in navigator) {
        await (navigator as any).share(data);
        return true;
      }
    } catch (error) {
      console.warn('Web Share API failed:', error);
    }
    return false;
  }

  // Get PWA installation status
  getPWADisplayMode(): string {
    if (this.isStandalone()) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    return 'browser';
  }

  // Check if PWA criteria are met
  checkInstallability(): { canInstall: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let canInstall = true;

    // Check if HTTPS or localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      canInstall = false;
      reasons.push('Must be served over HTTPS');
    }

    // Check if manifest exists
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      canInstall = false;
      reasons.push('Web app manifest is missing');
    }

    // Check if service worker is registered
    if (!this.registration) {
      canInstall = false;
      reasons.push('Service worker is not registered');
    }

    // Additional PWA checks
    try {
      // Check if manifest is valid
      if (manifestLink) {
        const manifestHref = (manifestLink as HTMLLinkElement).href;
        if (!manifestHref) {
          canInstall = false;
          reasons.push('Manifest link has no href');
        }
      }
      
      // Check if running in secure context
      if (!window.isSecureContext) {
        canInstall = false;
        reasons.push('Not running in secure context');
      }
      
      // Check for required PWA features
      if (!('serviceWorker' in navigator)) {
        canInstall = false;
        reasons.push('Service Worker not supported');
      }
      
      // Log additional info for debugging
      console.log('PWA Installability Debug:', {
        protocol: location.protocol,
        hostname: location.hostname,
        secureContext: window.isSecureContext,
        serviceWorkerSupport: 'serviceWorker' in navigator,
        manifestLink: !!manifestLink,
        registration: !!this.registration,
        standalone: this.isStandalone()
      });
      
    } catch (error) {
      console.warn('Error checking PWA installability:', error);
      reasons.push('Error checking PWA requirements');
    }
    return { canInstall, reasons };
  }
}

export const pwaService = new PWAService();