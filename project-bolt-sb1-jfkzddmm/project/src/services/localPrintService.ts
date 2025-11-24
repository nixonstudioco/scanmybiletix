/**
 * Local Print Service using Print Agent
 * Wrapper around the print agent for backward compatibility
 */

import { isPrintAgentAvailable, printReceipt, setPrintAgentToken, PrintOptions } from '../lib/printAgent';

// Set the token on module import
const TOKEN = '<<fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27>>';
setPrintAgentToken(TOKEN);

class LocalPrintService {
  private isConnected = false;

  /**
   * Check if local print agent is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      this.isConnected = await isPrintAgentAvailable(800);
      return this.isConnected;
    } catch (error) {
      console.warn('Local print agent not available:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isAvailable: boolean; isConnected: boolean } {
    return {
      isAvailable: this.isConnected,
      isConnected: this.isConnected
    };
  }

  /**
   * Print receipt using print agent
   */
  async printReceipt(lines: string[], options: PrintOptions = {}): Promise<void> {
    try {
      await printReceipt(lines, {
        cut: options.cut !== false, // Default to true
        drawer: options.drawer || false // Default to false
      });
      console.log('Receipt printed successfully via print agent');
    } catch (error) {
      console.error('Error printing via print agent:', error);
      throw new Error(`Print agent failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate ESC/POS lines for thermal receipt
   */
  generateReceiptLines(receiptData: {
    eventName: string;
    eventDate: string;
    ticketType: string;
    ticketCode: string;
    scanTime: string;
  }): string[] {
    const lines = [
      // Initialize and center alignment
      '\x1b\x40', // Initialize printer
      '\x1b\x61\x01', // Center alignment
      
      // Event name (large, bold)
      '\x1b\x21\x30', // Double size
      receiptData.eventName,
      '\x1b\x21\x00', // Normal size
      '',
      receiptData.eventDate,
      '',
      
      // Separator
      '================================',
      '',
      
      // Ticket type section
      'TIP BILET',
      '\x1b\x21\x20', // Double width
      receiptData.ticketType,
      '\x1b\x21\x00', // Reset
      '',
      `Scanat: ${receiptData.scanTime}`,
      '',
      
      // Verification section
      '\x1b\x21\x10', // Double height
      'INTRARE VERIFICATA',
      '\x1b\x21\x00', // Reset
      '',
      'Acces permis',
      `Bilet: ${receiptData.ticketCode}`,
      '',
      
      // Footer
      '================================',
      'Bon de verificare intrare',
      'Valabil doar pentru data evenimentului',
      `Generat: ${new Date().toLocaleString('ro-RO')}`,
      '',
      ''
    ];

    return lines;
  }

  /**
   * Print thermal receipt
   */
  async printThermalReceipt(receiptData: {
    eventName: string;
    eventDate: string;
    ticketType: string;
    ticketCode: string;
    scanTime: string;
  }): Promise<void> {
    const lines = this.generateReceiptLines(receiptData);
    await this.printReceipt(lines, { cut: true, drawer: false });
  }

  /**
   * Print test receipt
   */
  async testPrint(): Promise<void> {
    const testData = {
      eventName: 'TEST CLUB',
      eventDate: new Date().toLocaleDateString('ro-RO'),
      ticketType: 'TEST ENTRY',
      ticketCode: 'TEST123',
      scanTime: new Date().toLocaleTimeString('ro-RO')
    };

    await this.printThermalReceipt(testData);
  }
}

export const localPrintService = new LocalPrintService();