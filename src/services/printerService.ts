/**
 * Simplified Printer Service with Local API Integration
 * Provides basic printer management for browser printing
 */

import { localPrintService } from './localPrintService';
import { printerDetectionService } from './printerDetectionService';

export interface PrinterInfo {
  id: string;
  name: string;
  driverName?: string;
  portName?: string;
  status: 'ready' | 'offline' | 'busy' | 'error' | 'unknown';
  location?: string;
  description?: string;
  isDefault: boolean;
  isSystemPrinter: boolean;
  isNetworkPrinter: boolean;
  type: 'system' | 'generic' | 'thermal' | 'pos';
}

class PrinterService {
  private selectedPrinter: string | null = null;
  private cachedPrinters: PrinterInfo[] = [];

  constructor() {
    this.loadSettings();
  }

  /**
   * Load saved printer settings
   */
  private loadSettings(): void {
    try {
      this.selectedPrinter = localStorage.getItem('selectedPrinter');
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  }

  /**
   * Save printer settings
   */
  private saveSettings(): void {
    try {
      if (this.selectedPrinter) {
        localStorage.setItem('selectedPrinter', this.selectedPrinter);
      }
    } catch (error) {
      console.error('Error saving printer settings:', error);
    }
  }

  /**
   * Get local print server status
   */
  async getLocalPrintStatus() {
    return localPrintService.getConnectionStatus();
  }

  /**
   * Get all available printers
   */
  async getAvailablePrinters(): Promise<PrinterInfo[]> {
    try {
      // Get system printers if running in Electron
      const systemPrinters = await this.getSystemPrinters();
      
      // Get generic/fallback printers
      const genericPrinters = this.getGenericPrinters();
      
      // Combine and deduplicate
      const allPrinters = [...systemPrinters, ...genericPrinters];
      const uniquePrinters = this.deduplicatePrinters(allPrinters);
      
      // Set default printer
      await this.markDefaultPrinter(uniquePrinters);
      
      this.cachedPrinters = uniquePrinters;
      return uniquePrinters;
    } catch (error) {
      console.error('Error getting available printers:', error);
      return this.getGenericPrinters();
    }
  }

  /**
   * Get system printers using Electron APIs
   */
  private async getSystemPrinters(): Promise<PrinterInfo[]> {
    if (!window.electronAPI) {
      console.log('Not running in Electron, skipping system printer detection');
      return [];
    }

    try {
      console.log('Fetching system printers via Electron...');
      const printers = await window.electronAPI.getSystemPrinters();
      console.log('System printers found:', printers.length);
      return printers || [];
    } catch (error) {
      console.error('Error getting system printers:', error);
      return [];
    }
  }

  /**
   * Get generic/fallback printers for web environment
   */
  private getGenericPrinters(): PrinterInfo[] {
    const genericPrinters: PrinterInfo[] = [
      {
        id: 'thermal-58mm',
        name: 'Thermal Printer (58mm)',
        status: 'unknown',
        isDefault: false,
        isSystemPrinter: false,
        isNetworkPrinter: false,
        type: 'thermal',
        portName: 'USB001',
        description: 'Generic 58mm thermal receipt printer'
      },
      {
        id: 'thermal-80mm',
        name: 'Thermal Printer (80mm)',
        status: 'unknown',
        isDefault: false,
        isSystemPrinter: false,
        isNetworkPrinter: false,
        type: 'thermal',
        portName: 'USB002',
        description: 'Generic 80mm thermal receipt printer'
      },
      {
        id: 'pos-printer',
        name: 'POS Receipt Printer',
        status: 'unknown',
        isDefault: false,
        isSystemPrinter: false,
        isNetworkPrinter: false,
        type: 'pos',
        portName: 'COM1',
        description: 'Point of Sale receipt printer'
      },
      {
        id: 'default-printer',
        name: 'Default System Printer',
        status: 'unknown',
        isDefault: true,
        isSystemPrinter: false,
        isNetworkPrinter: false,
        type: 'generic',
        description: 'Uses system default printer'
      }
    ];

    return genericPrinters;
  }

  /**
   * Remove duplicate printers
   */
  private deduplicatePrinters(printers: PrinterInfo[]): PrinterInfo[] {
    const uniquePrinters = new Map<string, PrinterInfo>();
    
    printers.forEach(printer => {
      const key = printer.name.toLowerCase().trim();
      if (!uniquePrinters.has(key) || printer.isSystemPrinter) {
        uniquePrinters.set(key, printer);
      }
    });
    
    return Array.from(uniquePrinters.values());
  }

  /**
   * Mark the default printer
   */
  private async markDefaultPrinter(printers: PrinterInfo[]): Promise<void> {
    if (!window.electronAPI || printers.length === 0) {
      return;
    }

    try {
      const defaultPrinterName = await window.electronAPI.getDefaultPrinter();
      if (defaultPrinterName) {
        const defaultPrinter = printers.find(p => 
          p.name.toLowerCase() === defaultPrinterName.toLowerCase()
        );
        if (defaultPrinter) {
          defaultPrinter.isDefault = true;
        }
      }
    } catch (error) {
      console.error('Error getting default printer:', error);
    }
  }

  /**
   * Refresh printer list
   */
  async refreshPrinters(): Promise<PrinterInfo[]> {
    this.cachedPrinters = [];
    return await this.getAvailablePrinters();
  }

  /**
   * Select a printer
   */
  async selectPrinter(printerId: string): Promise<void> {
    this.selectedPrinter = printerId;
    this.saveSettings();
  }

  /**
   * Get selected printer
   */
  getSelectedPrinter(): string | null {
    return this.selectedPrinter;
  }

  /**
   * Print content to selected printer
   * Automatically checks printer connection before printing
   */
  async print(htmlContent: string): Promise<void> {
    // Verify printer connection before attempting to print
    const detectionResult = await printerDetectionService.verifyPrinterConnection();

    if (!detectionResult.isPrinterConnected) {
      throw new Error(`No printer connected: ${detectionResult.message}`);
    }

    if (!detectionResult.printingEnabled) {
      throw new Error('Printing is disabled. Please connect a printer and try again.');
    }

    // Always try local print server first
    const isLocalPrintAvailable = await localPrintService.checkConnection();
    if (isLocalPrintAvailable) {
      // For direct printing, we need to convert HTML to receipt lines
      // This is a simplified approach - you may want to enhance this
      const lines = this.convertHTMLToLines(htmlContent);
      await localPrintService.printReceipt(lines);
      return;
    }

    if (!this.selectedPrinter) {
      throw new Error('No printer selected and local print server not available');
    }

    const printer = this.cachedPrinters.find(p => p.id === this.selectedPrinter);

    // If running in Electron, use native printing
    if (window.electronAPI) {
      if (printer && printer.isSystemPrinter) {
        try {
          const result = await window.electronAPI.printToPrinter(printer.name, htmlContent);
          if (!result.success) {
            throw new Error(result.error || 'Print failed');
          }
          return;
        } catch (error) {
          console.error('Electron printing failed:', error);
          // Fall back to browser printing
        }
      }
    }

    // Fall back to browser printing
    await this.browserPrint(htmlContent);
  }

  /**
   * Browser printing fallback
   */
  private async browserPrint(htmlContent: string): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    printWindow.focus();
    printWindow.print();
    
    // Close after printing
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 10000);
  }

  /**
   * Convert HTML content to simple text lines for thermal printing
   */
  private convertHTMLToLines(htmlContent: string): string[] {
    // Simple HTML to text conversion
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }

  /**
   * Test printer with connection verification
   */
  async testPrint(): Promise<void> {
    // Verify printer connection first
    const detectionResult = await printerDetectionService.verifyPrinterConnection();

    if (!detectionResult.isPrinterConnected) {
      throw new Error(`No printer connected: ${detectionResult.message}`);
    }

    if (!detectionResult.printingEnabled) {
      throw new Error('Printing is disabled. Please connect a printer and try again.');
    }

    // Try local print server first
    const isLocalPrintAvailable = await localPrintService.checkConnection();
    if (isLocalPrintAvailable) {
      await localPrintService.testPrint();
      return;
    }

    if (!this.selectedPrinter) {
      throw new Error('No printer selected and local print server not available');
    }

    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Printer Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            text-align: center;
          }
          .test-content {
            border: 2px solid #000;
            padding: 20px;
            margin: 20px auto;
            max-width: 300px;
          }
        </style>
      </head>
      <body>
        <div class="test-content">
          <h2>QR Scan Printer Test</h2>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Printer:</strong> ${this.getSelectedPrinterName()}</p>
          <p><strong>Detection:</strong> ${detectionResult.detectionMethod}</p>
          <p><strong>Printers Found:</strong> ${detectionResult.printerCount}</p>
          <hr>
          <p>✅ Printer test successful!</p>
          <p>If you can see this page printed, your printer is working correctly.</p>
        </div>
      </body>
      </html>
    `;

    await this.print(testHTML);
  }

  /**
   * Print thermal receipt using QZ Tray ESC/POS
   */
  async printThermalReceipt(receiptData: {
    eventName: string;
    eventDate: string;
    ticketType: string;
    ticketCode: string;
    scanTime: string;
  }): Promise<void> {
    if (!this.selectedPrinter) {
      throw new Error('No printer selected');
    }

    const printer = this.cachedPrinters.find(p => p.id === this.selectedPrinter);
    
    if (printer?.isQZTrayPrinter) {
      await qzTrayService.printThermalReceipt(printer.name, receiptData);
    } else {
      throw new Error('Thermal receipt printing requires QZ Tray printer');
    }
  }

  /**
   * Get selected printer name
   */
  private getSelectedPrinterName(): string {
    if (!this.selectedPrinter) return 'None';
    const printer = this.cachedPrinters.find(p => p.id === this.selectedPrinter);
    return printer ? printer.name : this.selectedPrinter;
  }

  /**
   * Get USB ports using Electron API
   */
  async getUSBPortsFromSystem(): Promise<string[]> {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.getUSBPorts();
      } catch (error) {
        console.error('Error getting USB ports from system:', error);
      }
    }
    return [];
  }

  /**
   * Verify printer connection and return status
   */
  async verifyPrinterConnection() {
    return await printerDetectionService.verifyPrinterConnection();
  }

  /**
   * Check if printing is currently enabled
   */
  isPrintingEnabled(): boolean {
    return printerDetectionService.isPrintingEnabled();
  }

  /**
   * Request USB device access (for Web USB API)
   */
  async requestUSBAccess(): Promise<boolean> {
    return await printerDetectionService.requestUSBDeviceAccess();
  }

  /**
   * Clear printer detection cache
   */
  clearDetectionCache(): void {
    printerDetectionService.clearCache();
  }
}

export const printerService = new PrinterService();