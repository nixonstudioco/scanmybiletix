/// <reference types="vite/client" />

// Enhanced Electron API types
interface ElectronAPI {
  // File system
  selectFolder: () => Promise<{ canceled: boolean; filePath?: string }>;
  saveFile: (directory: string, filename: string, content: string) => Promise<{ success: boolean; error?: string }>;
  
  // Printer functions
  getSystemPrinters: () => Promise<Array<{
    id: string;
    name: string;
    driverName?: string;
    portName?: string;
    status: string;
    location?: string;
    description?: string;
    isSystemPrinter: boolean;
    isDefault: boolean;
    isNetworkPrinter: boolean;
    type: string;
  }>>;
  getDefaultPrinter: () => Promise<string | null>;
  printToPrinter: (printerName: string, htmlContent: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  testPrinter: (printerName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // USB/Serial ports
  getUSBPorts: () => Promise<string[]>;
  
  // Platform info
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}