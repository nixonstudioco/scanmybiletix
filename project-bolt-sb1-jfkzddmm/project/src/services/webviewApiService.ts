/**
 * WebView-compatible API Service
 * Provides enhanced API calls with WebView-specific optimizations
 */
import { supabaseService } from './supabase';
import { isBasicWebView } from '../utils/webviewCompatibility';
import { webviewLog } from '../utils/webviewCompatibility';
import { Ticket } from '../types';

export const webviewApiService = {
  // WebView-optimized connection check
  async checkConnection(): Promise<boolean> {
    try {
      webviewLog.log('WebView checking connection...');
      
      // Attempt a simple database query to verify connectivity
      const count = await supabaseService.tickets.count();
      webviewLog.log('WebView connection check successful, ticket count:', count);
      return true;
    } catch (error) {
      webviewLog.error('WebView connection check failed:', error);
      return false;
    }
  },

  // WebView-optimized scan recording
  async recordScan(qrCode: string, success: boolean, message: string): Promise<void> {
    try {
      webviewLog.log('WebView recording scan:', { qrCode, success, message });
      
      const scan = {
        qrCode,
        timestamp: new Date().toISOString(),
        success,
        message
      };
      
      // Add retry logic for WebView
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await supabaseService.scans.record(scan);
          webviewLog.log('WebView scan recorded successfully');
          return;
        } catch (error) {
          lastError = error;
          webviewLog.warn(`WebView scan recording attempt ${attempt + 1} failed:`, error);
          
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      webviewLog.error('WebView scan recording failed:', error);
      throw error;
    }
  },

  // WebView-optimized ticket count
  async getTicketCount(): Promise<number> {
    try {
      webviewLog.log('WebView getting ticket count...');
      
      const count = await supabaseService.tickets.count();
      webviewLog.log('WebView ticket count:', count);
      return count;
    } catch (error) {
      webviewLog.error('WebView ticket count failed:', error);
      return 0;
    }
  },

  // WebView-optimized bulk import
  async importTickets(tickets: Ticket[]): Promise<{ success: boolean; count: number }> {
    try {
      webviewLog.log('WebView importing tickets:', tickets.length);
      
      // For basic WebView, import in smaller batches
      if (isBasicWebView() && tickets.length > 50) {
        webviewLog.log('Basic WebView detected, using batch import');
        
        let totalImported = 0;
        const batchSize = 25;
        
        for (let i = 0; i < tickets.length; i += batchSize) {
          const batch = tickets.slice(i, i + batchSize);
          webviewLog.log(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tickets.length / batchSize)}`);
          
          try {
            const result = await supabaseService.tickets.importBulk(batch);
            totalImported += result.count;
          } catch (error) {
            webviewLog.error('Batch import failed:', error);
            // Continue with next batch
          }
          
          // Small delay between batches for WebView
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return { success: totalImported > 0, count: totalImported };
      } else {
        // Normal import for modern WebViews
        const result = await supabaseService.tickets.importBulk(tickets);
        webviewLog.log('WebView tickets imported successfully');
        return result;
      }
    } catch (error) {
      webviewLog.error('WebView ticket import failed:', error);
      throw error;
    }
  }
};