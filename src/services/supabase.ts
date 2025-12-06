import { createClient } from '@supabase/supabase-js';
import { Ticket, ScanHistory, AppSettings } from '../types';

export interface PrinterSettings {
  id: string;
  selectedPrinter: string | null;
  printerName: string | null;
  printerType: string;
  printEnabled: boolean;
  autoprint: boolean;
  paperSize: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// Table names
export const TABLES = {
  TICKETS: 'tickets',
  SCAN_HISTORY: 'scan_history',
  SETTINGS: 'app_settings',
  PRINTER_SETTINGS: 'printer_settings'
};

// Supabase service methods
export const supabaseService = {
  supabase,
  
  // Add method to get current project info
  getProjectInfo: () => {
    const url = supabaseUrl || '';
    const projectId = url.split('.')[0]?.split('//')[1] || 'unknown';
    return {
      projectId,
      url: supabaseUrl,
      isValid: true // Simplified for now
    };
  },
  
  tickets: {
    async getAll(): Promise<Ticket[]> {
      const { data, error } = await supabase
        .from(TABLES.TICKETS)
        .select('*');
      
      if (error) throw error;
      return data || [];
    },

    async getByQrCode(qrCode: string): Promise<Ticket | null> {
      const trimmedQrCode = qrCode.trim();

      const { data, error } = await supabase
        .from(TABLES.TICKETS)
        .select('*')
        .or(`qrCode.eq.${trimmedQrCode},qrCode.eq.${trimmedQrCode}\n`)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data;
    },

    async create(ticket: Ticket): Promise<Ticket> {
      const { data, error } = await supabase
        .from(TABLES.TICKETS)
        .insert(ticket)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(qrCode: string, ticket: Partial<Ticket>): Promise<Ticket> {
      const { data, error } = await supabase
        .from(TABLES.TICKETS)
        .update(ticket)
        .eq('qrCode', qrCode)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(qrCode: string): Promise<void> {
      const { error } = await supabase
        .from(TABLES.TICKETS)
        .delete()
        .eq('qrCode', qrCode);
      
      if (error) throw error;
    },

    async importBulk(tickets: Ticket[]): Promise<{ success: boolean; count: number }> {
      const { data, error } = await supabase
        .from(TABLES.TICKETS)
        .upsert(tickets, {
          onConflict: 'qrCode',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      return { success: true, count: tickets.length };
    },

    async count(): Promise<number> {
      const { count, error } = await supabase
        .from(TABLES.TICKETS)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },

    async clearAll(): Promise<void> {
      const { error } = await supabase
        .from(TABLES.TICKETS)
        .delete()
        .neq('qrCode', 'impossible_value');  // Delete all rows
      
      if (error) throw error;
    }
  },

  scans: {
    async getAll(): Promise<ScanHistory[]> {
      const { data, error } = await supabase
        .from(TABLES.SCAN_HISTORY)
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async record(scan: Omit<ScanHistory, 'id'>): Promise<ScanHistory> {
      // Explicitly destructure to exclude any potential id field and ensure clean data
      const { qrCode, timestamp, success, message } = scan;
      const scanData = { qrCode, timestamp, success, message };
      
      const { data, error } = await supabase
        .from(TABLES.SCAN_HISTORY)
        .insert(scanData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async clearAll(): Promise<void> {
      const { error } = await supabase
        .from(TABLES.SCAN_HISTORY)
        .delete()
        .neq('id', -1);  // Delete all rows
      
      if (error) throw error;
    }
  },

  settings: {
    async getSettings(): Promise<AppSettings | null> {
      const { data, error } = await supabase
        .from(TABLES.SETTINGS)
        .select('*')
        .maybeSingle();
      
      if (error) {
        // If the error is that the table doesn't exist, we can create it
        if (error.message.includes('does not exist')) {
          await this.createSettingsTable();
          return null;
        }
        throw error;
      }
      
      return data;
    },
    
    async createSettingsTable(): Promise<void> {
      // This should be done via SQL function in Supabase
      const { error } = await supabase.rpc('create_settings_table');
      if (error) throw error;
      
      // Create default settings if needed
      const settings = await this.getSettings();
      if (!settings) {
        await this.saveSettings({
          id: 'settings',
          logoUrl: null,
          clubName: 'Famous Summer Club',
          ean13Barcode: '1234567890128',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    },
    
    async saveSettings(settings: AppSettings): Promise<AppSettings> {
      settings.updatedAt = new Date().toISOString();
      
      const { data, error } = await supabase
        .from(TABLES.SETTINGS)
        .upsert(settings, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async uploadLogo(file: File): Promise<string> {
      // First check if the bucket exists by trying to list it
      try {
        const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
        
        if (bucketListError) {
          throw new Error(`Failed to check storage buckets: ${bucketListError.message}`);
        }
        
        const appAssetsBucket = buckets?.find(bucket => bucket.name === 'app-assets');
        
        if (!appAssetsBucket) {
          throw new Error('BUCKET_NOT_FOUND: The "app-assets" storage bucket does not exist. Please create it manually in your Supabase dashboard:\n\n1. Go to your Supabase project dashboard\n2. Navigate to "Storage" in the sidebar\n3. Click "Create new bucket"\n4. Name it "app-assets"\n5. Enable "Public bucket" option\n6. Set MIME types to: image/png, image/jpeg, image/gif');
        }
        
        if (!appAssetsBucket.public) {
          throw new Error('BUCKET_NOT_PUBLIC: The "app-assets" bucket exists but is not public. Please make it public in your Supabase dashboard:\n\n1. Go to Storage > app-assets\n2. Click on bucket settings\n3. Enable "Public bucket" option');
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('BUCKET_')) {
          throw error;
        }
        throw new Error(`Failed to verify storage bucket: ${(error as Error).message}`);
      }
      
      // Upload to Supabase storage
      const filename = `logo-${Date.now()}`;
      const { data, error } = await supabase
        .storage
        .from('app-assets')
        .upload(`logos/${filename}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        // Handle specific storage errors
        if (error.message?.includes('Bucket not found') || error.message?.includes('bucket does not exist')) {
          throw new Error('BUCKET_NOT_FOUND: The "app-assets" storage bucket does not exist. Please create it manually in your Supabase dashboard:\n\n1. Go to your Supabase project dashboard\n2. Navigate to "Storage" in the sidebar\n3. Click "Create new bucket"\n4. Name it "app-assets"\n5. Enable "Public bucket" option\n6. Set MIME types to: image/png, image/jpeg, image/gif');
        }
        
        if (error.message?.includes('not allowed to perform this operation')) {
          throw new Error('BUCKET_NOT_PUBLIC: The "app-assets" bucket is not accessible. Please ensure it is set to public in your Supabase dashboard.');
        }
        
        throw new Error(`Failed to upload logo: ${error.message}`);
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('app-assets')
        .getPublicUrl(data.path);
      
      // Update settings with new logo URL
      const settings = await this.getSettings();
      if (settings) {
        await this.saveSettings({
          ...settings,
          logoUrl: publicUrlData.publicUrl
        });
      } else {
        await this.saveSettings({
          id: 'settings',
          logoUrl: publicUrlData.publicUrl,
          clubName: 'Famous Summer Club',
          ean13Barcode: '1234567890123',
          adminPin: '123456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return publicUrlData.publicUrl;
    }
  },
  
  // Printer settings management
  printer: {
    async getSettings(): Promise<PrinterSettings | null> {
      const { data, error } = await supabase
        .from(TABLES.PRINTER_SETTINGS)
        .select('*')
        .eq('id', 'settings')
        .maybeSingle();
      
      if (error) {
        if (error.message.includes('does not exist')) {
          await this.createPrinterSettingsTable();
          return null;
        }
        throw error;
      }
      
      return data;
    },
    
    async createPrinterSettingsTable(): Promise<void> {
      // This should be done via SQL migration
      const { error } = await supabase.rpc('create_printer_settings_table');
      if (error) {
        console.warn('Could not create printer_settings table automatically:', error);
      }
    },
    
    async saveSettings(settings: Partial<PrinterSettings>): Promise<PrinterSettings> {
      const settingsData = {
        ...settings,
        id: 'settings',
        updatedAt: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(TABLES.PRINTER_SETTINGS)
        .upsert(settingsData, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async updateSelectedPrinter(printerId: string, printerName: string, printerType: string): Promise<void> {
      const { error } = await supabase
        .from(TABLES.PRINTER_SETTINGS)
        .upsert({
          id: 'settings',
          selectedPrinter: printerId,
          printerName: printerName,
          printerType: printerType,
          updatedAt: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) throw error;
    }
  },
  
  // Add the core validateTicket method directly to supabaseService
  async validateTicket(qrCode: string): Promise<{
    valid: boolean;
    message: string;
    ticket?: Ticket;
  }> {
    try {
      const trimmedQrCode = qrCode.trim();

      // 1. Get the ticket from database (check both with and without trailing newline)
      const { data: ticket, error: fetchError } = await supabase
        .from(TABLES.TICKETS)
        .select('*')
        .or(`qrCode.eq.${trimmedQrCode},qrCode.eq.${trimmedQrCode}\n`)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!ticket) {
        return { valid: false, message: 'Ticket not found' };
      }

      // 2. Check entriesRemaining field
      if (ticket.entriesRemaining === 0) {
        return { 
          valid: false, 
          message: 'No entries remaining - access denied', 
          ticket 
        };
      }
      
      if (ticket.entriesRemaining < 0) {
        return { 
          valid: false, 
          message: 'Invalid ticket - negative entries', 
          ticket 
        };
      }

      // 3. Grant access and decrement entriesRemaining
      const updatedTicketData = {
        entriesRemaining: ticket.entriesRemaining - 1,
        lastScanned: new Date().toISOString()
      };

      const { data: updatedTicket, error: updateError } = await supabase
        .from(TABLES.TICKETS)
        .update(updatedTicketData)
        .eq('qrCode', ticket.qrCode)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return { 
        valid: true, 
        message: `Access granted - ${updatedTicket.entriesRemaining} entries remaining`,
        ticket: updatedTicket
      };
      
    } catch (error) {
      console.error('Error validating ticket:', error);
      throw new Error(`Could not validate ticket: ${(error as Error).message}`);
    }
  }
};