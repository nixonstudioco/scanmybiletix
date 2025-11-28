/**
 * Printer Detection Service
 * Detects connected printers and manages printing availability
 */

import { printerService } from './printerService';
import { localPrintService } from './localPrintService';

export interface PrinterDetectionResult {
  isPrinterConnected: boolean;
  printerCount: number;
  detectedPrinters: Array<{
    name: string;
    type: string;
    status: string;
  }>;
  printingEnabled: boolean;
  detectionMethod: 'system' | 'local-agent' | 'none';
  message: string;
}

class PrinterDetectionService {
  private lastDetectionResult: PrinterDetectionResult | null = null;
  private detectionInProgress = false;

  /**
   * Main function to verify if printer is connected
   * Returns detection result and automatically enables/disables printing
   */
  async verifyPrinterConnection(): Promise<PrinterDetectionResult> {
    if (this.detectionInProgress) {
      return this.lastDetectionResult || this.createNoConnectionResult('Detection already in progress');
    }

    this.detectionInProgress = true;

    try {
      // Method 1: Check local print agent (most reliable for thermal printers)
      const localAgentResult = await this.checkLocalPrintAgent();
      if (localAgentResult.isPrinterConnected) {
        this.lastDetectionResult = localAgentResult;
        this.detectionInProgress = false;
        return localAgentResult;
      }

      // Method 2: Check system printers (for desktop/electron environment)
      const systemPrintersResult = await this.checkSystemPrinters();
      if (systemPrintersResult.isPrinterConnected) {
        this.lastDetectionResult = systemPrintersResult;
        this.detectionInProgress = false;
        return systemPrintersResult;
      }

      // Method 3: Check USB devices (if Web USB API is available)
      const usbDevicesResult = await this.checkUSBDevices();
      if (usbDevicesResult.isPrinterConnected) {
        this.lastDetectionResult = usbDevicesResult;
        this.detectionInProgress = false;
        return usbDevicesResult;
      }

      // No printer detected by any method
      const noConnectionResult = this.createNoConnectionResult('No printer detected');
      this.lastDetectionResult = noConnectionResult;
      this.detectionInProgress = false;
      return noConnectionResult;

    } catch (error) {
      console.error('Error during printer detection:', error);
      const errorResult = this.createNoConnectionResult(
        `Detection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.lastDetectionResult = errorResult;
      this.detectionInProgress = false;
      return errorResult;
    }
  }

  /**
   * Check local print agent availability
   */
  private async checkLocalPrintAgent(): Promise<PrinterDetectionResult> {
    try {
      const isConnected = await localPrintService.checkConnection();

      if (isConnected) {
        return {
          isPrinterConnected: true,
          printerCount: 1,
          detectedPrinters: [{
            name: 'Local Print Agent',
            type: 'thermal',
            status: 'ready'
          }],
          printingEnabled: true,
          detectionMethod: 'local-agent',
          message: 'Local print agent connected and ready'
        };
      }
    } catch (error) {
      console.warn('Local print agent check failed:', error);
    }

    return this.createNoConnectionResult('Local print agent not available');
  }

  /**
   * Check system printers (Electron or browser print API)
   */
  private async checkSystemPrinters(): Promise<PrinterDetectionResult> {
    try {
      const printers = await printerService.getAvailablePrinters();

      // Filter out generic/fallback printers - only count real system printers
      const systemPrinters = printers.filter(p => p.isSystemPrinter);

      if (systemPrinters.length > 0) {
        return {
          isPrinterConnected: true,
          printerCount: systemPrinters.length,
          detectedPrinters: systemPrinters.map(p => ({
            name: p.name,
            type: p.type,
            status: p.status
          })),
          printingEnabled: true,
          detectionMethod: 'system',
          message: `Found ${systemPrinters.length} system printer(s)`
        };
      }
    } catch (error) {
      console.warn('System printer check failed:', error);
    }

    return this.createNoConnectionResult('No system printers found');
  }

  /**
   * Check USB devices using Web USB API
   */
  private async checkUSBDevices(): Promise<PrinterDetectionResult> {
    // Check if Web USB API is available
    if (!navigator.usb) {
      return this.createNoConnectionResult('Web USB API not available');
    }

    try {
      // Get list of paired USB devices
      const devices = await navigator.usb.getDevices();

      // Common printer vendor IDs
      const printerVendorIds = [
        0x04b8, // Epson
        0x04f9, // Brother
        0x03f0, // HP
        0x04a9, // Canon
        0x0924, // Zebra
        0x0483, // STMicroelectronics (common in thermal printers)
        0x0416, // Star Micronics
        0x0dd4, // Custom (thermal printer manufacturer)
        0x154f, // Wincor Nixdorf
        0x1504, // Citizen
      ];

      const printerDevices = devices.filter(device =>
        printerVendorIds.includes(device.vendorId)
      );

      if (printerDevices.length > 0) {
        return {
          isPrinterConnected: true,
          printerCount: printerDevices.length,
          detectedPrinters: printerDevices.map(device => ({
            name: device.productName || `USB Device (${device.vendorId.toString(16)})`,
            type: 'usb',
            status: 'connected'
          })),
          printingEnabled: true,
          detectionMethod: 'system',
          message: `Found ${printerDevices.length} USB printer device(s)`
        };
      }
    } catch (error) {
      console.warn('USB device check failed:', error);
    }

    return this.createNoConnectionResult('No USB printer devices found');
  }

  /**
   * Create a "no connection" result
   */
  private createNoConnectionResult(message: string): PrinterDetectionResult {
    return {
      isPrinterConnected: false,
      printerCount: 0,
      detectedPrinters: [],
      printingEnabled: false,
      detectionMethod: 'none',
      message
    };
  }

  /**
   * Get last detection result without re-checking
   */
  getLastDetectionResult(): PrinterDetectionResult | null {
    return this.lastDetectionResult;
  }

  /**
   * Check if printing is currently enabled
   */
  isPrintingEnabled(): boolean {
    return this.lastDetectionResult?.printingEnabled || false;
  }

  /**
   * Request USB device access (user must grant permission)
   */
  async requestUSBDeviceAccess(): Promise<boolean> {
    if (!navigator.usb) {
      console.warn('Web USB API not available');
      return false;
    }

    try {
      // This will prompt user to select a USB device
      const device = await navigator.usb.requestDevice({
        filters: [
          // Epson printers
          { vendorId: 0x04b8 },
          // Brother printers
          { vendorId: 0x04f9 },
          // HP printers
          { vendorId: 0x03f0 },
          // Canon printers
          { vendorId: 0x04a9 },
          // Zebra printers
          { vendorId: 0x0924 },
          // Generic thermal printers
          { vendorId: 0x0483 },
          { vendorId: 0x0dd4 },
          // Star Micronics
          { vendorId: 0x0416 },
        ]
      });

      if (device) {
        console.log('USB device granted:', device.productName);
        // Re-run detection after granting access
        await this.verifyPrinterConnection();
        return true;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.log('User cancelled USB device selection');
      } else {
        console.error('Error requesting USB device:', error);
      }
    }

    return false;
  }

  /**
   * Clear cached detection result (force re-check on next verify)
   */
  clearCache(): void {
    this.lastDetectionResult = null;
  }
}

export const printerDetectionService = new PrinterDetectionService();
