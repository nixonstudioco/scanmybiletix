import { apiService } from './api';
import { Ticket, ScanHistory } from '../types';
import { webviewLog } from '../utils/webviewCompatibility';

class TicketDatabase {
  constructor() {
    webviewLog.log('TicketDatabase initialized');
  }

  /**
   * Validate a ticket using the exact workflow from working project:
   * 1. Check ticket in database
   * 2. Check entriesRemaining field
   * 3. If 0: deny access
   * 4. If > 0: grant access and decrement
   */
  async validateTicket(qrCode: string): Promise<{ 
    valid: boolean; 
    message: string; 
    ticket?: Ticket;
  }> {
    try {
      webviewLog.log('DB: Starting ticket validation for:', qrCode);
      
      // Step 1: Fetch ticket from database
      const ticket = await apiService.tickets.getByQrCode(qrCode);
      
      // Step 2: Check if ticket exists
      if (!ticket) {
        webviewLog.log('DB: Ticket not found');
        return { 
          valid: false, 
          message: 'Ticket not found'
        };
      }
      
      webviewLog.log('DB: Ticket found:', ticket);
      
      // Step 3: Check entriesRemaining field
      if (ticket.entriesRemaining === 0) {
        webviewLog.log('DB: No entries remaining');
        return { 
          valid: false, 
          message: 'No entries remaining - access denied', 
          ticket 
        };
      }
      
      if (ticket.entriesRemaining < 0) {
        webviewLog.log('DB: Invalid ticket - negative entries');
        return { 
          valid: false, 
          message: 'Invalid ticket - negative entries', 
          ticket 
        };
      }
      
      // Step 4: Grant access and decrement entriesRemaining
      const updatedTicket = await apiService.tickets.update(qrCode, {
        entriesRemaining: ticket.entriesRemaining - 1,
        lastScanned: new Date().toISOString()
      });
      
      webviewLog.log('DB: Ticket updated successfully:', updatedTicket);
      
      return { 
        valid: true, 
        message: `Access granted - ${updatedTicket.entriesRemaining} entries remaining`,
        ticket: updatedTicket
      };
      
    } catch (error) {
      webviewLog.error('DB: Error validating ticket:', error);
      return { 
        valid: false, 
        message: `Error processing scan: ${(error as Error).message}`
      };
    }
  }

  /**
   * Record scan attempt in history
   */
  async recordScan(qrCode: string, success: boolean, message: string): Promise<void> {
    const scan = {
      qrCode,
      timestamp: new Date().toISOString(),
      success,
      message
    };
    
    try {
      webviewLog.log('DB: Recording scan in history');
      await apiService.scans.record(scan);
      webviewLog.log('DB: Scan recorded successfully');
    } catch (error) {
      webviewLog.error('DB: Error recording scan:', error);
      throw new Error(`Could not record scan: ${(error as Error).message}`);
    }
  }

  async clearAllData(): Promise<void> {
    try {
      webviewLog.log('DB: Clearing all data');
      await apiService.tickets.clearAll();
      await apiService.scans.clearAll();
      webviewLog.log('DB: All data cleared successfully');
    } catch (error) {
      webviewLog.error('DB: Error clearing data:', error);
      throw error;
    }
  }
  
  async getTicketsCount(): Promise<number> {
    try {
      webviewLog.log('DB: Getting ticket count');
      return await apiService.tickets.count();
    } catch (error) {
      webviewLog.error('DB: Error getting ticket count:', error);
      return 0;
    }
  }
}

export const db = new TicketDatabase();