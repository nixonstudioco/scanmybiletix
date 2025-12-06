/**
 * WebView Compatibility Utilities
 * Provides polyfills and fallbacks for basic Android WebView browsers
 */

// Polyfill for Promise.allSettled (not available in older WebView)
if (!Promise.allSettled) {
  Promise.allSettled = function(promises: Promise<any>[]): Promise<any[]> {
    return Promise.all(
      promises.map(promise =>
        promise
          .then(value => ({ status: 'fulfilled', value }))
          .catch(reason => ({ status: 'rejected', reason }))
      )
    );
  };
}

// Polyfill for String.prototype.replaceAll (not available in older WebView)
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search: string | RegExp, replace: string): string {
    if (search instanceof RegExp) {
      return this.replace(new RegExp(search.source, search.flags + (search.global ? '' : 'g')), replace);
    }
    return this.split(search).join(replace);
  };
}

// Polyfill for Array.prototype.at (not available in older WebView)
if (!Array.prototype.at) {
  Array.prototype.at = function(index: number) {
    const len = this.length;
    const relativeIndex = Math.trunc(index) || 0;
    const actualIndex = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
    return actualIndex >= 0 && actualIndex < len ? this[actualIndex] : undefined;
  };
}

// Enhanced fetch with timeout and retry for unreliable WebView connections
export const webviewFetch = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = 10000,
  retries: number = 3
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers
    }
  };
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === retries - 1) {
        clearTimeout(timeoutId);
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error('All fetch attempts failed');
};

// WebView detection
export const isWebView = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('wv') || // Android WebView
    userAgent.includes('webview') ||
    (userAgent.includes('android') && !userAgent.includes('chrome')) ||
    (window as any).AndroidInterface !== undefined || // Common WebView interface
    (window as any).webkit?.messageHandlers !== undefined // iOS WebView
  );
};

// Check if running in basic/old WebView
export const isBasicWebView = (): boolean => {
  if (!isWebView()) return false;
  
  // Check for missing modern features
  const hasModernFeatures = (
    'IntersectionObserver' in window &&
    'ResizeObserver' in window &&
    'fetch' in window &&
    'Promise' in window &&
    'Map' in window &&
    'Set' in window
  );
  
  return !hasModernFeatures;
};

// Get WebView version info
export const getWebViewInfo = (): { version: string; isOld: boolean } => {
  const userAgent = navigator.userAgent;
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  const webViewMatch = userAgent.match(/wv\) AppleWebKit\/[\d.]+ \(KHTML, like Gecko\) Version\/[\d.]+ Chrome\/(\d+)/);
  
  let version = 'unknown';
  let isOld = true;
  
  if (chromeMatch) {
    version = chromeMatch[1];
    isOld = parseInt(version) < 70; // Chrome 70+ has better WebView support
  } else if (webViewMatch) {
    version = webViewMatch[1];
    isOld = parseInt(version) < 70;
  }
  
  return { version, isOld };
};

// Enhanced localStorage with error handling for WebView
export const webviewStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
      return false;
    }
  }
};

// Simple event emitter for WebView communication
export class WebViewEventEmitter {
  private events: { [key: string]: Function[] } = {};
  
  on(event: string, callback: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  off(event: string, callback: Function): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event: string, data?: any): void {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }
}

// WebView-safe console logging
export const webviewLog = {
  log: (...args: any[]) => {
    try {
      console.log(...args);
      // Also try to send to Android interface if available
      if ((window as any).AndroidInterface?.log) {
        (window as any).AndroidInterface.log(JSON.stringify(args));
      }
    } catch (error) {
      // Fallback for very basic WebViews
      try {
        console.log('Log:', JSON.stringify(args));
      } catch (e) {
        // Silent fail
      }
    }
  },
  
  error: (...args: any[]) => {
    try {
      console.error(...args);
      if ((window as any).AndroidInterface?.error) {
        (window as any).AndroidInterface.error(JSON.stringify(args));
      }
    } catch (error) {
      try {
        console.log('Error:', JSON.stringify(args));
      } catch (e) {
        // Silent fail
      }
    }
  },
  
  warn: (...args: any[]) => {
    try {
      console.warn(...args);
      if ((window as any).AndroidInterface?.warn) {
        (window as any).AndroidInterface.warn(JSON.stringify(args));
      }
    } catch (error) {
      try {
        console.log('Warning:', JSON.stringify(args));
      } catch (e) {
        // Silent fail
      }
    }
  }
};

// Initialize WebView compatibility
export const initWebViewCompatibility = (): void => {
  webviewLog.log('Initializing WebView compatibility...');
  
  const webViewInfo = getWebViewInfo();
  webviewLog.log('WebView info:', webViewInfo);
  
  // Add WebView class to body for CSS targeting
  if (isWebView()) {
    document.body.classList.add('webview');
    if (isBasicWebView()) {
      document.body.classList.add('basic-webview');
    }
  }
  
  // Disable problematic features in old WebViews
  if (webViewInfo.isOld) {
    // Disable animations that might cause performance issues
    const style = document.createElement('style');
    style.textContent = `
      .basic-webview * {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      .basic-webview .animate-spin {
        animation: none !important;
      }
      .basic-webview .animate-pulse {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Handle WebView-specific errors
  window.addEventListener('error', (event) => {
    webviewLog.error('Global error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    webviewLog.error('Unhandled promise rejection:', event.reason);
  });
  
  webviewLog.log('WebView compatibility initialized');
};