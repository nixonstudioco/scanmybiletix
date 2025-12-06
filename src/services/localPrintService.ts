/**
 * Local Print Service using Print Agent
 * Wrapper around the print agent for backward compatibility
 */

import { isPrintAgentAvailable, printReceipt, PrintOptions } from '../lib/printAgent';

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
    const ESC = '\x1B';
    const INIT = '\x1b\x40';
    const CENTER = '\x1b\x61\x01';
    const LEFT = '\x1b\x61\x00';
    const F_NORMAL = '\x1b\x21\x00';
    const F_BOLD = '\x1b\x21\x08';
    const F_LARGE = '\x1b\x21\x30';
    const F_LARGE_BOLD = '\x1b\x21\x38';
    const F_DBL_HEIGHT = '\x1b\x21\x10';
    const F_DBL_WIDTH = '\x1b\x21\x20';

    const lines = [
      INIT,
      CENTER,
      '',
      // Event name - Large and bold
      F_LARGE_BOLD,
      receiptData.eventName,
      F_NORMAL,
      '',
      F_BOLD,
      receiptData.eventDate,
      F_NORMAL,
      '',
      '==========================================',
      '',
      // TIP BILET - Large and bold
      F_LARGE_BOLD,
      'TIP BILET',
      F_NORMAL,
      '',
      F_DBL_WIDTH + F_BOLD,
      receiptData.ticketType,
      F_NORMAL,
      '',
      '==========================================',
      '',
      // Scanned date and time - Bold
      F_BOLD,
      'DATA SI ORA SCANARE',
      F_NORMAL,
      '',
      F_DBL_HEIGHT,
      receiptData.scanTime,
      F_NORMAL,
      '',
      '==========================================',
      '',
      // INTRARE VERIFICATA - Large and bold
      F_LARGE_BOLD,
      'INTRARE',
      'VERIFICATA',
      F_NORMAL,
      '',
      F_LARGE,
      '✓ ACCES PERMIS',
      F_NORMAL,
      '',
      '==========================================',
      '',
      // Ticket details
      LEFT,
      F_BOLD,
      'DETALII BILET:',
      F_NORMAL,
      '',
      CENTER,
      `Cod: ${receiptData.ticketCode}`,
      '',
      F_BOLD,
      'Status: VALIDAT',
      F_NORMAL,
      '',
      '==========================================',
      '',
      // Footer
      F_NORMAL,
      'BON DE VERIFICARE INTRARE',
      'Valabil doar pentru data evenimentului',
      '',
      `Generat: ${new Date().toLocaleString('ro-RO')}`,
      '',
      F_BOLD,
      'VA MULTUMIM!',
      F_NORMAL,
      '',
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