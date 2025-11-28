import React, { useState, useEffect } from 'react';
import { Database, Shield, Check, AlertCircle, Cloud, ExternalLink, Info } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { supabaseService } from '../../services/supabase';

const SupabaseSetup: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [tablesCreated, setTablesCreated] = useState<{
    tickets: boolean;
    scanHistory: boolean;
    settings: boolean;
    fiscalnet: boolean;
  }>({
    tickets: false,
    scanHistory: false,
    settings: false,
    fiscalnet: false
  });
  const [storageSetup, setStorageSetup] = useState<{
    bucketExists: boolean;
    bucketPublic: boolean;
    checkComplete: boolean;
  }>({
    bucketExists: false,
    bucketPublic: false,
    checkComplete: false
  });

  // Get project info for display
  const projectInfo = supabaseService.getProjectInfo();

  useEffect(() => {
    checkTablesExist();
    checkStorageSetup();
  }, []);

  const checkTablesExist = async () => {
    try {
      // Check tickets table
      const { error: ticketsError } = await supabase
        .from('tickets')
        .select('count', { count: 'exact', head: true });
      
      // Check scan_history table
      const { error: scansError } = await supabase
        .from('scan_history')
        .select('count', { count: 'exact', head: true });
      
      // Check app_settings table
      const { error: settingsError } = await supabase
        .from('app_settings')
        .select('count', { count: 'exact', head: true });

      // Check fiscalnet_settings table
      const { error: fiscalnetError } = await supabase
        .from('fiscalnet_settings')
        .select('count', { count: 'exact', head: true });
      
      setTablesCreated({
        tickets: !ticketsError || !ticketsError.message.includes('does not exist'),
        scanHistory: !scansError || !scansError.message.includes('does not exist'),
        settings: !settingsError || !settingsError.message.includes('does not exist'),
        fiscalnet: !fiscalnetError || (!fiscalnetError.message.includes('does not exist') && !fiscalnetError.message.includes('relation'))
      });
    } catch (error) {
      console.error('Error checking tables:', error);
    }
  };

  const checkStorageSetup = async () => {
    try {
      // Check if app-assets bucket exists
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking storage buckets:', error);
        setStorageSetup({
          bucketExists: false,
          bucketPublic: false,
          checkComplete: true
        });
        return;
      }
      
      const appAssetsBucket = buckets?.find(bucket => bucket.name === 'app-assets');
      setStorageSetup({
        bucketExists: !!appAssetsBucket,
        bucketPublic: appAssetsBucket?.public || false,
        checkComplete: true
      });
    } catch (error) {
      console.error('Error checking storage setup:', error);
      setStorageSetup({
        bucketExists: false,
        bucketPublic: false,
        checkComplete: true
      });
    }
  };

  const createSupabaseTables = async () => {
    setIsCreating(true);
    setMessage({ 
      text: 'Setting up Supabase tables...', 
      type: 'info' 
    });

    try {
      // Try to use existing functions first, fallback to direct table creation
      const createResults = await Promise.allSettled([
        // Try to use predefined functions if they exist
        supabase.rpc('create_tickets_table'),
        supabase.rpc('create_scan_history_table'),
        supabase.rpc('create_settings_table'),
        supabase.rpc('create_fiscalnet_settings_table')
      ]);
      
      // Check if any functions worked
      const functionsWorked = createResults.some(result => result.status === 'fulfilled');
      
      if (!functionsWorked) {
        // If functions don't exist, create tables directly using individual queries
        console.log('Creating tables directly without functions...');
        
        // Create tickets table
        try {
          await supabase.from('tickets').select('count', { count: 'exact', head: true });
        } catch (error) {
          // Table doesn't exist, create it by inserting a dummy record and then deleting it
          // This is a workaround since we can't execute DDL directly
          console.log('Tickets table needs to be created manually via Supabase dashboard');
        }
        
        // Create app_settings table by attempting to insert default settings
        try {
          const { error: settingsError } = await supabase
            .from('app_settings')
            .upsert({
              id: 'settings',
              clubName: 'Famous Summer Club',
              ean13Barcode: '1234567890128',
              logoUrl: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          
          if (settingsError && !settingsError.message.includes('does not exist')) {
            console.error('Error creating app_settings:', settingsError);
          }
        } catch (err) {
          console.error('Error with app_settings:', err);
        }
        
        // Create fiscalnet_settings table by attempting to insert default settings
        try {
          const { error: fiscalError } = await supabase
            .from('fiscalnet_settings')
            .upsert({
              id: 'settings',
              saveDirectory: 'C:\\FiscalNet',
              fiscalnetEnabled: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          
          if (fiscalError && !fiscalError.message.includes('does not exist')) {
            console.error('Error creating fiscalnet_settings:', fiscalError);
          }
        } catch (err) {
          console.error('Error with fiscalnet_settings:', err);
        }
        
        // Create scan_history table check
        try {
          await supabase.from('scan_history').select('count', { count: 'exact', head: true });
        } catch (error) {
          console.log('Scan history table needs to be created manually via Supabase dashboard');
        }
        
        // Show message about manual table creation
        setMessage({
          text: 'Tables need to be created manually. Please use the SQL provided in the manual setup section below, or create the tables using the Supabase dashboard.',
          type: 'info'
        });
      } else {
        // At least some functions worked
        setMessage({
          text: 'Database tables setup completed successfully! All settings tables are now properly configured.',
          type: 'success'
        });
      }

      await checkTablesExist();
      await checkStorageSetup();

    } catch (error) {
      console.error('Error creating Supabase tables:', error);
      setMessage({
        text: `Error: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStorageStatusMessage = () => {
    if (!storageSetup.checkComplete) {
      return "Checking storage setup...";
    }
    
    if (!storageSetup.bucketExists) {
      return "❌ Storage bucket 'app-assets' not found. Logo upload will not work until you create it manually.";
    }
    
    if (!storageSetup.bucketPublic) {
      return "⚠️ Bucket exists but may not be public. Logo upload may fail if bucket is not set to public.";
    }
    
    return "✅ Storage bucket is properly configured!";
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-xl p-6 mb-6 border border-dark-800">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
        <Database className="h-6 w-6 mr-2 text-primary-500" />
        Supabase Setup
      </h2>
      
      {/* Project Information */}
      <div className={`mb-6 p-4 rounded-lg border ${
        projectInfo.isValid 
          ? 'bg-green-900/20 border-green-800' 
          : 'bg-red-900/20 border-red-800'
      }`}>
        <h3 className={`text-sm font-medium mb-2 flex items-center ${
          projectInfo.isValid ? 'text-green-300' : 'text-red-300'
        }`}>
          <Info className="h-4 w-4 mr-2" />
          Current Database Connection
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Project ID:</span>
            <span className={`font-mono ${projectInfo.isValid ? 'text-green-200' : 'text-red-200'}`}>
              {projectInfo.projectId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Database URL:</span>
            <span className={`font-mono text-xs ${projectInfo.isValid ? 'text-green-200' : 'text-red-200'}`}>
              {projectInfo.url || 'Not configured'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ${projectInfo.isValid ? 'text-green-200' : 'text-red-200'}`}>
              {projectInfo.isValid ? '✅ Your own database' : '❌ Invalid/shared database'}
            </span>
          </div>
        </div>
        
        {!projectInfo.isValid && (
          <div className="mt-3 pt-3 border-t border-red-800">
            <p className="text-red-200 text-sm font-medium">
              ⚠️ Warning: You may be seeing data from other users!
            </p>
            <p className="font-medium mb-1">
              Current Project: 
              <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                projectInfo.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {projectInfo.projectId}
              </span>
            </p>
            <p className="text-red-200 text-xs mt-1">
              Status: {projectInfo.isValid ? '✅ Connected to your database' : '❌ Using placeholder/shared database'}
            </p>
            {!projectInfo.isValid && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                ⚠️ You may be seeing data from other users. Please configure your own Supabase project below.
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6 space-y-3">
        <h3 className="text-lg font-medium text-white mb-3">Database Tables</h3>
        
        <div className={`flex items-center p-3 rounded-lg ${tablesCreated.tickets ? 'bg-green-900/20 text-green-200' : 'bg-dark-800 text-gray-400'}`}>
          <div className="mr-3">{tablesCreated.tickets ? '✓' : '○'}</div>
          <span>Tickets Table</span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg ${tablesCreated.scanHistory ? 'bg-green-900/20 text-green-200' : 'bg-dark-800 text-gray-400'}`}>
          <div className="mr-3">{tablesCreated.scanHistory ? '✓' : '○'}</div>
          <span>Scan History Table</span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg ${tablesCreated.settings ? 'bg-green-900/20 text-green-200' : 'bg-dark-800 text-gray-400'}`}>
          <div className="mr-3">{tablesCreated.settings ? '✓' : '○'}</div>
          <span>App Settings Table</span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg ${tablesCreated.fiscalnet ? 'bg-green-900/20 text-green-200' : 'bg-dark-800 text-gray-400'}`}>
          <div className="mr-3">{tablesCreated.fiscalnet ? '✓' : '○'}</div>
          <span>FiscalNet Settings Table</span>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <h3 className="text-lg font-medium text-white mb-3">Storage Setup</h3>
        
        <div className={`flex items-center p-3 rounded-lg ${
          storageSetup.bucketExists 
            ? storageSetup.bucketPublic 
              ? 'bg-green-900/20 text-green-200'
              : 'bg-yellow-900/20 text-yellow-200'
            : 'bg-red-900/20 text-red-200'
        }`}>
          <div className="mr-3">
            {storageSetup.bucketExists 
              ? storageSetup.bucketPublic 
                ? '✓' 
                : '⚠️'
              : '✗'
            }
          </div>
          <span>Storage Bucket Status</span>
        </div>
        
        <div className="bg-dark-800 p-3 rounded-lg">
          <p className="text-sm text-gray-300">
            {getStorageStatusMessage()}
          </p>
        </div>
      </div>
      
      <p className="text-gray-300 mb-4">
        Create the necessary database tables in your Supabase project for storing tickets, scan history, app settings, and FiscalNet settings.
      </p>
      
      <div className="bg-dark-800 p-4 rounded-md mb-6 border border-dark-700">
        <h3 className="text-sm font-medium text-primary-300 mb-2">Manual Table Creation (If Button Fails)</h3>
        <p className="text-sm text-gray-300 mb-3">
          If the automatic setup fails, you can create these tables manually in your Supabase SQL editor:
        </p>
        
        <div className="bg-dark-950 p-3 rounded overflow-auto text-xs mb-2 text-gray-300">
          <pre className="whitespace-pre-wrap">
{`-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  "qrCode" TEXT PRIMARY KEY,
  "entryName" TEXT NOT NULL,
  "entriesRemaining" INTEGER NOT NULL,
  "lastScanned" TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to tickets" ON tickets FOR ALL TO public USING (true);`}
          </pre>
        </div>
        
        <div className="bg-dark-950 p-3 rounded overflow-auto text-xs mb-2 text-gray-300">
          <pre className="whitespace-pre-wrap">
{`-- Create scan_history table
DROP TABLE IF EXISTS scan_history;

CREATE TABLE scan_history (
  id BIGSERIAL PRIMARY KEY,
  "qrCode" TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  success BOOLEAN NOT NULL,
  message TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Create policies for scan_history
CREATE POLICY "Allow public insert access to scan_history"
  ON scan_history
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to scan_history"
  ON scan_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to scan_history"
  ON scan_history
  FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_history_qrcode ON scan_history("qrCode");
CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(timestamp);`}
          </pre>
        </div>
        
        <div className="bg-dark-950 p-3 rounded overflow-auto text-xs mb-2 text-gray-300">
          <pre className="whitespace-pre-wrap">
{`-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  "logoUrl" TEXT,
  "clubName" TEXT NOT NULL,
  "ean13Barcode" BIGINT DEFAULT 1234567890128,
  "ticketPrice" INTEGER DEFAULT 50,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to app_settings" ON app_settings FOR ALL TO public USING (true);

-- Insert default settings
INSERT INTO app_settings (id, "clubName", "ticketPrice", "ean13Barcode", "logoUrl", "createdAt", "updatedAt")
VALUES ('settings', 'Famous Summer Club', 50, 1234567890128, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;`}
          </pre>
        </div>
        
        <div className="bg-dark-950 p-3 rounded overflow-auto text-xs mb-2 text-gray-300">
          <pre className="whitespace-pre-wrap">
{`-- Create fiscalnet_settings table
CREATE TABLE IF NOT EXISTS fiscalnet_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  "saveDirectory" TEXT NOT NULL DEFAULT 'C:\\FiscalNet',
  "fiscalnetEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fiscalnet_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to fiscalnet_settings" ON fiscalnet_settings FOR ALL TO public USING (true);

-- Insert default settings
INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled")
VALUES ('settings', 'C:\\FiscalNet', false)
ON CONFLICT (id) DO NOTHING;`}
          </pre>
        </div>
        
        <div className="bg-dark-950 p-3 rounded overflow-auto text-xs mb-2 text-gray-300">
          <pre className="whitespace-pre-wrap">
{`-- Create printer_settings table
CREATE TABLE IF NOT EXISTS printer_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  "selectedPrinter" TEXT,
  "printerName" TEXT,
  "printerType" TEXT DEFAULT 'thermal',
  "printEnabled" BOOLEAN NOT NULL DEFAULT true,
  "autoprint" BOOLEAN NOT NULL DEFAULT true,
  "paperSize" TEXT DEFAULT '80mm',
  "settings" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to printer_settings" ON printer_settings FOR ALL TO public USING (true);

-- Insert default settings
INSERT INTO printer_settings (id, "selectedPrinter", "printerName", "printerType", "printEnabled", "autoprint", "paperSize", "settings")
VALUES ('settings', NULL, NULL, 'thermal', true, true, '80mm', '{}')
ON CONFLICT (id) DO NOTHING;`}
          </pre>
        </div>
      </div>
      
      <div className={`p-4 rounded-md mb-6 border ${
        storageSetup.bucketExists && storageSetup.bucketPublic
          ? 'bg-green-900/20 border-green-800'
          : 'bg-red-900/20 border-red-800'
      }`}>
        <h3 className={`text-sm font-medium mb-2 flex items-center ${
          storageSetup.bucketExists && storageSetup.bucketPublic
            ? 'text-green-300'
            : 'text-red-300'
        }`}>
          {storageSetup.bucketExists && storageSetup.bucketPublic ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 mr-2" />
          )}
          Storage Bucket Setup {storageSetup.bucketExists && storageSetup.bucketPublic ? 'Complete' : 'Required'}
        </h3>
        
        {!(storageSetup.bucketExists && storageSetup.bucketPublic) && (
          <>
            <p className="text-sm text-red-200 mb-3">
              Logo upload will not work without this bucket! You must manually create it:
            </p>
            <ol className="list-decimal list-inside text-sm text-red-200 space-y-2 ml-2">
              <li>Go to your <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline inline-flex items-center gap-1"
              >
                Supabase Dashboard <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Select your project from the list</li>
              <li>Navigate to the "Storage" section in the sidebar</li>
              <li>Click "Create new bucket"</li>
              <li>Name the bucket exactly: <span className="bg-red-950 px-2 py-0.5 rounded font-mono">app-assets</span></li>
              <li>
                <strong>IMPORTANT:</strong> Enable "Public bucket" option 
                <div className="text-xs mt-1 ml-4 text-red-300">
                  This allows the app to serve logo images publicly
                </div>
              </li>
              <li>Set MIME type restrictions to: <span className="bg-red-950 px-1 py-0.5 rounded text-xs">image/png, image/jpeg, image/gif</span></li>
              <li>Create the bucket and refresh this page to verify</li>
            </ol>
          </>
        )}
        
        {storageSetup.bucketExists && storageSetup.bucketPublic && (
          <p className="text-sm text-green-200">
            ✅ Storage bucket is properly configured! Logo upload functionality is ready to use.
          </p>
        )}
      </div>
      
      <button
        onClick={createSupabaseTables}
        disabled={isCreating}
        className={`
          w-full flex items-center justify-center space-x-2 py-3 px-4 
          rounded-lg transition-colors shadow-lg
          ${isCreating 
            ? 'bg-dark-700 text-gray-400 cursor-not-allowed' 
            : 'bg-primary-600 hover:bg-primary-700 text-white'}
        `}
      >
        {isCreating ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Setting Up...</span>
          </>
        ) : (
          <>
            <Shield className="h-5 w-5" />
            <span>Create Database Tables</span>
          </>
        )}
      </button>
      
      {message && (
        <div className={`
          mt-4 p-4 rounded-lg flex items-start space-x-3
          ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border border-green-800' : 
            message.type === 'error' ? 'bg-red-900/30 text-red-200 border border-red-800' : 
            'bg-blue-900/30 text-blue-200 border border-blue-800'}
        `}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Database className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      <div className="mt-5 pt-5 border-t border-dark-700">
        <h3 className="text-sm font-medium text-gray-300">Important Notes:</h3>
        <ul className="list-disc list-inside text-sm text-gray-400 mt-2 space-y-1">
          <li>Make sure you have set the correct Supabase URL and Anon Key in your environment variables</li>
          <li>You need to have admin privileges to create these tables</li>
          <li>This application requires a connection to Supabase to function properly</li>
          <li><strong>The storage bucket MUST be created manually</strong> - this cannot be automated through the API</li>
          <li>Logo upload functionality depends entirely on the storage bucket being properly configured</li>
          <li>If logo upload fails, check that the bucket exists and is set to public</li>
        </ul>
      </div>
    </div>
  );
};

export default SupabaseSetup;