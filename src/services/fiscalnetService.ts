/**
 * FiscalNet Integration Service
 * Handles communication with the FiscalNet driver for CARD payments
 */

import { supabaseService } from './supabase';

export interface FiscalNetSettings {
  id: string;
  saveDirectory: string;
  fiscalnetEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardPaymentData {
  amount: number;
  reference: string;
  paymentMethod: 'CARD';
}

// Local storage key for caching settings
const FISCALNET_SETTINGS_KEY = 'fiscalnet_settings';

// Service functions
export const fiscalnetService = {
  /**
   * Get save directory from database
   */
  async getSaveDirectory(): Promise<string> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('fiscalnet_settings')
        .select('saveDirectory')
        .eq('id', 'settings')
        .single();
      
      if (error) {
        // If table doesn't exist, return default directory
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('FiscalNet settings table does not exist, using default directory');
          return 'C:\\FiscalNet';
        }
        if (error.code === 'PGRST116') {
          // No settings found, create default
          await this.setSaveDirectory('C:\\FiscalNet');
          return 'C:\\FiscalNet';
        }
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data.saveDirectory || 'C:\\FiscalNet';
    } catch (error) {
      console.error('Error getting save directory:', error);
      // Return default directory if database error
      return 'C:\\FiscalNet';
    }
  },
  
  /**
   * Set save directory in database
   */
  async setSaveDirectory(directory: string): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('fiscalnet_settings')
        .upsert({
          id: 'settings',
          saveDirectory: directory,
          fiscalnetEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        // If table doesn't exist, just log and continue
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('FiscalNet settings table does not exist, cannot save directory');
          return;
        }
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error setting save directory:', error);
      // Don't throw error if table doesn't exist
      if (error instanceof Error && !error.message.includes('does not exist')) {
        throw error;
      }
    }
  },

  /**
   * Get FiscalNet settings from Supabase database
   */
  async getSettings(): Promise<FiscalNetSettings> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('fiscalnet_settings')
        .select('*')
        .eq('id', 'settings')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, create default settings
          const defaultSettings = this.getDefaultSettings();
          return await this.saveSettings(defaultSettings);
        } else if (error.code === '42P01' || error.message.includes('does not exist')) {
          throw new Error('FiscalNet settings table not found. Please create the table using the Setup tab.');
        } else if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS')) {
          throw new Error('Database access denied. Please check Row Level Security policies for fiscalnet_settings table.');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        id: data.id,
        saveDirectory: data.saveDirectory || 'C:\\FiscalNet',
        fiscalnetEnabled: true, // Always enabled
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error('Error loading FiscalNet settings:', error);
      throw error;
    }
  },
  
  /**
   * Save FiscalNet settings to Supabase database
   */
  async saveSettings(settings: FiscalNetSettings): Promise<FiscalNetSettings> {
    try {
      settings.updatedAt = new Date().toISOString();
      
      const { data, error } = await supabaseService.supabase
        .from('fiscalnet_settings')
        .upsert(settings, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          throw new Error('FiscalNet settings table not found. Please create the table using the Setup tab.');
        } else if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS')) {
          throw new Error('Database access denied. Please check Row Level Security policies for fiscalnet_settings table.');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving FiscalNet settings:', error);
      throw error;
    }
  },
  
  /**
   * Get default FiscalNet settings
   */
  getDefaultSettings(): FiscalNetSettings {
    return {
      id: 'settings',
      saveDirectory: 'C:\\FiscalNet',
      fiscalnetEnabled: true, // Always enabled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  
  /**
   * Get FiscalNet settings from local storage (for offline fallback)
   */
  getLocalSettings(): FiscalNetSettings {
    try {
      const savedSettings = localStorage.getItem(FISCALNET_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return {
          ...parsed,
          fiscalnetEnabled: true // Always enabled
        };
      }
    } catch (error) {
      console.error('Error reading FiscalNet settings from localStorage:', error);
    }
    
    return this.getDefaultSettings();
  },
  
  /**
   * Process a card payment through FiscalNet
   * This generates a pos_bancar.txt file in the specified directory
   */
  async processCardPayment(
    paymentData: CardPaymentData, 
    customDirectory?: string
  ): Promise<{success: boolean; message: string}> {
    try {
      // Get save directory from database if not provided
      let saveDirectory = customDirectory;
      
      if (!saveDirectory) {
        try {
          saveDirectory = await this.getSaveDirectory();
        } catch (error) {
          console.warn('Could not get save directory from database, using default');
          saveDirectory = 'C:\\FiscalNet';
        }
      }
      
      // Generate the pos_bancar.txt content
      const fileContent = this.generateFileContent(paymentData);
      
      // Try to save the file
      const saveResult = await this.saveFile(fileContent, saveDirectory);
      
      if (saveResult.success) {
        return { 
          success: true, 
          message: `Payment file generated successfully. Amount: ${paymentData.amount} RON. File saved to: ${saveDirectory}`
        };
      } else {
        return saveResult; // Return the error from saveFile
      }
    } catch (error) {
      console.error('Error processing card payment:', error);
      return { 
        success: false, 
        message: `Error processing card payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
  
  /**
   * Generate the content for the pos_bancar.txt file
   * Format: POS^amount
   */
  generateFileContent(paymentData: CardPaymentData): string {
    // Format: POS^amount (e.g., POS^50)
    return `POS^${paymentData.amount}`;
  },
  
  /**
   * Save the pos_bancar.txt file to the specified directory
   */
  async saveFile(
    content: string, 
    directory: string
  ): Promise<{success: boolean; message: string}> {
    try {
      // Try to use Electron API first
      if (window.electronAPI && window.electronAPI.saveFile) {
        const result = await window.electronAPI.saveFile(directory, 'pos_bancar.txt', content);
        if (result.success) {
          return {
            success: true,
            message: `Payment file saved to ${directory}\\pos_bancar.txt`
          };
        } else {
          return {
            success: false,
            message: `Failed to save file: ${result.error}`
          };
        }
      }
      
      // Handle file saving for web/PWA
      const fileName = 'pos_bancar.txt';
      
      // Try File System Access API if available
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            startIn: 'desktop',
            types: [{
              description: 'Text files',
              accept: {
                'text/plain': ['.txt']
              }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          
          return {
            success: true,
            message: `Payment file saved successfully. Please move it to: ${directory}`
          };
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            return {
              success: false,
              message: 'File save cancelled by user'
            };
          }
          console.warn('File System Access API failed:', error);
          // Fall through to blob download
        }
      }
      
      // Fallback to blob download with instructions
      try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return {
          success: true,
          message: `Payment file downloaded as ${fileName}. Please move it to: ${directory}`
        };
      } catch (error) {
        console.error('Error downloading file:', error);
        return {
          success: false,
          message: `Error downloading payment file: ${(error as Error).message}`
        };
      }
      
    } catch (error) {
      console.error('Error saving pos_bancar.txt:', error);
      return {
        success: false,
        message: `Error saving payment file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export default fiscalnetService;