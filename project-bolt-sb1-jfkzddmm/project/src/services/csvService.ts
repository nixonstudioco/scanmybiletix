import Papa from 'papaparse';
import { db } from './db';
import { webviewApiService } from './webviewApiService';
import { Ticket } from '../types';
import { webviewLog } from '../utils/webviewCompatibility';

export const parseCSV = (file: File): Promise<Ticket[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const tickets: Ticket[] = results.data.map((row: any) => {
            // Validate required fields
            if (!row.qrCode) {
              throw new Error('CSV missing required qrCode field');
            }

            return {
              qrCode: row.qrCode,
              entryName: row.entryName || 'Default Entry',
              entriesRemaining: parseInt(row.entriesRemaining || '1', 10),
              lastScanned: null,
              club: row.club || 'Default Club'
            };
          });
          resolve(tickets);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const generateCSVTemplate = (): Blob => {
  const csvContent = `qrCode,entryName,entriesRemaining,club
TICKET001,Regular Entry,1,Capricci
TICKET002,VIP Access,3,Intooit
TICKET003,Backstage Pass,2,Capricci`;
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

export const importTickets = async (file: File): Promise<{ 
  success: boolean; 
  message: string; 
  count?: number;
}> => {
  try {
    const tickets = await parseCSV(file);
    
    if (tickets.length === 0) {
      return { success: false, message: "No valid tickets found in the CSV file" };
    }
    
    // Deduplicate tickets based on qrCode to prevent Supabase upsert conflicts
    const uniqueTicketsMap = new Map<string, Ticket>();
    tickets.forEach(ticket => {
      uniqueTicketsMap.set(ticket.qrCode, ticket);
    });
    const uniqueTickets = Array.from(uniqueTicketsMap.values());
    
    const duplicateCount = tickets.length - uniqueTickets.length;
    if (duplicateCount > 0) {
      webviewLog.log(`CSV: Removed ${duplicateCount} duplicate tickets based on qrCode`);
    }
    
    webviewLog.log(`CSV: Parsed ${uniqueTickets.length} unique tickets from CSV`);
    
    // Check if backend is available using WebView-optimized check
    const isBackendAvailable = await webviewApiService.checkConnection();
    
    if (isBackendAvailable) {
      try {
        webviewLog.log('CSV: Importing tickets via WebView API...');
        const result = await webviewApiService.importTickets(uniqueTickets);
        if (result.success) {
          const message = duplicateCount > 0 
            ? `Successfully imported ${result.count} unique tickets to the database (${duplicateCount} duplicates were skipped)`
            : `Successfully imported ${result.count} tickets to the database`;
          
          return { 
            success: true, 
            message, 
            count: result.count 
          };
        } else {
          return {
            success: false,
            message: "Failed to import tickets to database"
          };
        }
      } catch (error) {
        webviewLog.error('CSV: Error importing tickets:', error);
        throw new Error(`Error importing tickets to backend: ${(error as Error).message}`);
      }
    } else {
      return {
        success: false,
        message: "Supabase backend is not available. Please check your Supabase credentials and try again."
      };
    }
  } catch (error) {
    webviewLog.error('CSV: Error in import process:', error);
    return { 
      success: false, 
      message: `Error importing tickets: ${(error as Error).message}` 
    };
  }
};