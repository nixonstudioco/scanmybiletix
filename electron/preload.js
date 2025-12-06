const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Printer functions
  getSystemPrinters: () => ipcRenderer.invoke('get-system-printers'),
  getDefaultPrinter: () => ipcRenderer.invoke('get-default-printer'),
  printToPrinter: (printerName, htmlContent) => ipcRenderer.invoke('print-to-printer', printerName, htmlContent),
  testPrinter: (printerName) => ipcRenderer.invoke('test-printer', printerName),
  
  // USB/Serial port functions
  getUSBPorts: () => ipcRenderer.invoke('get-usb-ports'),
  
  // File system functions
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (directory, filename, content) => ipcRenderer.invoke('save-file', directory, filename, content),
  
  // Utility functions
  platform: process.platform,
  isElectron: true
});