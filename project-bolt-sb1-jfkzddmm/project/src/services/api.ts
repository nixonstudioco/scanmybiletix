import { supabaseService } from './supabase';
import { Ticket, ScanHistory } from '../types';

// Helper to check if backend is available
export const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    // Ping Supabase with a simple query to check connectivity
    const { data, error } = await supabaseService.supabase
      .from('tickets')
      .select('count', { count: 'exact', head: true });
    
    // If we get here without an error being thrown, the connection is working
    if (error && error.message.includes('does not exist')) {
      // Table doesn't exist yet, but connection works - that's fine
      console.log('Supabase connection successful, but tables may need to be created');
      return true;
    }
    
    return !error;
  } catch (error) {
    console.error('Backend connectivity check failed:', error);
    return false;
  }
};

// API service methods - direct delegation to Supabase
export const apiService = {
  // Add direct reference to supabase client for backend checks
  supabase: supabaseService.supabase,
  
  // Core validation method - delegates to supabaseService
  validateTicket: async (qrCode: string): Promise<{ 
    valid: boolean; 
    message: string; 
    ticket?: Ticket;
  }> => {
    return await supabaseService.validateTicket(qrCode);
  },
  
  // Ticket-related API methods
  tickets: {
    // Get all tickets
    getAll: async (): Promise<Ticket[]> => {
      return await supabaseService.tickets.getAll();
    },

    // Get ticket by QR code - core validation step
    getByQrCode: async (qrCode: string): Promise<Ticket | null> => {
      return await supabaseService.tickets.getByQrCode(qrCode);
    },

    // Create a new ticket
    create: async (ticket: Ticket): Promise<Ticket> => {
      return await supabaseService.tickets.create(ticket);
    },

    // Update an existing ticket - used for decrementing entries
    update: async (qrCode: string, ticket: Partial<Ticket>): Promise<Ticket> => {
      return await supabaseService.tickets.update(qrCode, ticket);
    },

    // Delete a ticket
    delete: async (qrCode: string): Promise<void> => {
      return await supabaseService.tickets.delete(qrCode);
    },

    // Import tickets from array
    importBulk: async (tickets: Ticket[]): Promise<{ success: boolean; count: number }> => {
      return await supabaseService.tickets.importBulk(tickets);
    },

    // Get ticket count
    count: async (): Promise<number> => {
      return await supabaseService.tickets.count();
    },

    // Clear all tickets
    clearAll: async (): Promise<void> => {
      return await supabaseService.tickets.clearAll();
    }
  },

  // Scan history related API methods
  scans: {
    // Get all scan history
    getAll: async (): Promise<ScanHistory[]> => {
      return await supabaseService.scans.getAll();
    },

    // Record a new scan - audit trail step
    record: async (scan: Omit<ScanHistory, 'id'>): Promise<ScanHistory> => {
      return await supabaseService.scans.record(scan);
    },

    // Clear all scan history
    clearAll: async (): Promise<void> => {
      return await supabaseService.scans.clearAll();
    }
  }
};