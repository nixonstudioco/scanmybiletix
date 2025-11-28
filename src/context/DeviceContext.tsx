import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DeviceMode = 'mobile' | 'desktop';

interface DeviceContextType {
  mode: DeviceMode;
  setMode: (mode: DeviceMode) => void;
  isMobile: boolean;
  isDesktop: boolean;
  autoDetectedMode: DeviceMode;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider = ({ children }: DeviceProviderProps) => {
  const [mode, setMode] = useState<DeviceMode>('mobile');
  const [autoDetectedMode, setAutoDetectedMode] = useState<DeviceMode>('mobile');

  useEffect(() => {
    // Auto-detect device type
    const detectDevice = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      const screenWidth = window.innerWidth;
      
      // Consider it mobile if:
      // - It's a touch device AND screen width < 1024px
      // - OR if it has camera capabilities and small screen
      const detectedMode: DeviceMode = (isTouchDevice && screenWidth < 1024) || 
                                       (hasCamera && screenWidth < 768) ? 'mobile' : 'desktop';
      
      setAutoDetectedMode(detectedMode);
      
      // Set initial mode based on detection if not previously set
      const savedMode = localStorage.getItem('deviceMode') as DeviceMode;
      if (savedMode) {
        setMode(savedMode);
      } else {
        setMode(detectedMode);
        localStorage.setItem('deviceMode', detectedMode);
      }
    };

    detectDevice();
    
    // Re-detect on resize
    const handleResize = () => {
      detectDevice();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSetMode = (newMode: DeviceMode) => {
    setMode(newMode);
    localStorage.setItem('deviceMode', newMode);
  };

  return (
    <DeviceContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        isMobile: mode === 'mobile',
        isDesktop: mode === 'desktop',
        autoDetectedMode
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};