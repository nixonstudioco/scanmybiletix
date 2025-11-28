import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { webviewApiService } from '../services/webviewApiService';
import { supabaseService } from '../services/supabase';
import { Ticket, ScanResult, AppSettings } from '../types';
import { webviewLog, isBasicWebView } from '../utils/webviewCompatibility';

interface AppContextType {
  isScanning: boolean;
  setIsScanning: (value: boolean) => void;
  lastScanResult: ScanResult | null;
  setLastScanResult: (result: ScanResult | null) => void;
  recentScans: ScanResult[];
  addScan: (scan: ScanResult) => void;
  clearRecentScans: () => void;
  ticketsCount: number;
  refreshTicketsCount: () => void;
  isLoading: boolean;
  backendStatus: 'connected' | 'disconnected' | 'checking';
  flashColor: 'green' | 'red' | null;
  setFlashColor: (color: 'green' | 'red' | null) => void;
  appSettings: AppSettings | null;
  setAppSettings: (settings: AppSettings) => void;
  refreshAppSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [ticketsCount, setTicketsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Check backend connectivity and count tickets on app start
  useEffect(() => {
    checkBackendAndLoadData();
    // Set up a periodic check every 30 seconds
    const intervalId = setInterval(checkBackendAndLoadData, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Load app settings on mount and after backend connection is established
  useEffect(() => {
    if (backendStatus === 'connected') {
      refreshAppSettings();
    }
  }, [backendStatus]);

  // Update document title when app settings change
  useEffect(() => {
    const clubName = appSettings?.clubName || 'Famous Summer Club';
    document.title = `${clubName} Scan`;
  }, [appSettings]);

  const checkBackendAndLoadData = async () => {
    setIsLoading(true);
    setBackendStatus('checking');
    webviewLog.log('AppContext: Checking backend connection...');
    
    // Check if we're using a valid database configuration
    const projectInfo = supabaseService.getProjectInfo();
    if (!projectInfo.isValid) {
      console.warn('⚠️ Invalid database configuration detected. Running in offline mode.');
      setBackendStatus('disconnected');
      setTicketsCount(0);
      setIsLoading(false);
      return;
    }
    
    try {
      // Use WebView-optimized connection check
      const isBackendAvailable = await webviewApiService.checkConnection();
      
      if (isBackendAvailable) {
        // Get count using WebView-optimized API
        const count = await webviewApiService.getTicketCount();
        setTicketsCount(count);
        setBackendStatus('connected');
        webviewLog.log('AppContext: Backend connected, ticket count:', count);
      } else {
        webviewLog.error('AppContext: Backend not available');
        setBackendStatus('disconnected');
        setTicketsCount(0);
      }
    } catch (error) {
      webviewLog.error('AppContext: Error checking backend:', error);
      setBackendStatus('disconnected');
      setTicketsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAppSettings = async () => {
    if (backendStatus !== 'connected') return;
    
    try {
      webviewLog.log('AppContext: Refreshing app settings...');
      setAppSettings(null);
      
      const settings = await supabaseService.settings.getSettings();
      setAppSettings(settings || {
        id: 'settings',
        logoUrl: null,
        clubName: 'Famous Summer Club',
        ean13Barcode: 1234567890128,
        ticketPrice: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      webviewLog.log('AppContext: App settings loaded');
    } catch (error) {
      webviewLog.error('AppContext: Error loading app settings:', error);
      // Set default settings if there's an error
      setAppSettings({
        id: 'settings',
        logoUrl: null,
        clubName: 'Famous Summer Club',
        ean13Barcode: '1234567890128',
        ticketPrice: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const refreshTicketsCount = async () => {
    setIsLoading(true);
    webviewLog.log('AppContext: Refreshing ticket count...');
    
    try {
      const isBackendAvailable = await webviewApiService.checkConnection();
      
      if (isBackendAvailable) {
        const count = await webviewApiService.getTicketCount();
        setTicketsCount(count);
        setBackendStatus('connected');
        webviewLog.log('AppContext: Ticket count refreshed:', count);
      } else {
        webviewLog.error('AppContext: Backend not available during refresh');
        setBackendStatus('disconnected');
        setTicketsCount(0);
      }
    } catch (error) {
      webviewLog.error('AppContext: Error refreshing ticket count:', error);
      setBackendStatus('disconnected');
      setTicketsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const addScan = (scan: ScanResult) => {
    setRecentScans(prevScans => {
      const newScans = [scan, ...prevScans].slice(0, 10); // Keep only the last 10 scans
      return newScans;
    });
  };

  const clearRecentScans = () => {
    setRecentScans([]);
  };

  return (
    <AppContext.Provider
      value={{
        isScanning,
        setIsScanning,
        lastScanResult,
        setLastScanResult,
        recentScans,
        addScan,
        clearRecentScans,
        ticketsCount,
        refreshTicketsCount,
        isLoading,
        backendStatus,
        flashColor,
        setFlashColor,
        appSettings,
        setAppSettings,
        refreshAppSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};