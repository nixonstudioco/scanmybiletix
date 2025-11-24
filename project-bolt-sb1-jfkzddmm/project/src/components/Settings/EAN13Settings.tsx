import React, { useState } from 'react';
import { Barcode, Save, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabase';
import { useAppContext } from '../../context/AppContext';

const EAN13Settings: React.FC = () => {
  const { appSettings, refreshAppSettings, backendStatus } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [ean13Barcode, setEan13Barcode] = useState(appSettings?.ean13Barcode || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const generateRandomEAN13 = () => {
    // Generate a random 12-digit number
    const randomNumber = Math.floor(Math.random() * 999999999999).toString().padStart(12, '0');
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(randomNumber[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    const newEan13 = randomNumber + checkDigit;
    setEan13Barcode(newEan13);
  };

  const handleSave = async () => {
    if (!ean13Barcode.trim()) {
      setMessage({
        text: 'EAN13 barcode cannot be empty',
        type: 'error'
      });
      return;
    }

    // Validate EAN13 format (13 digits)
    if (!/^\d{13}$/.test(ean13Barcode)) {
      setMessage({
        text: 'EAN13 barcode must be exactly 13 digits',
        type: 'error'
      });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      if (backendStatus !== 'connected') {
        throw new Error('Not connected to Supabase. Please check your credentials and try again.');
      }
      
      if (!appSettings) {
        await supabaseService.settings.saveSettings({
          id: 'settings',
          logoUrl: null,
          clubName: 'Famous Summer Club',
          ean13Barcode: ean13Barcode.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await supabaseService.settings.saveSettings({
          ...appSettings,
          ean13Barcode: ean13Barcode.trim(),
          updatedAt: new Date().toISOString()
        });
      }
      
      setMessage({
        text: 'EAN13 barcode updated successfully',
        type: 'success'
      });
      
      setIsEditing(false);
      
      // Force refresh app settings from database
      await refreshAppSettings();
      
      // Wait a moment for the refresh to complete then verify the save
      setTimeout(() => {
        if (appSettings?.ean13Barcode !== ean13Barcode.trim()) {
          setMessage({
            text: 'Settings saved but may not be reflected immediately. Please refresh the page.',
            type: 'error'
          });
        }
      }, 1000);
      
    } catch (error) {
      setMessage({
        text: `Error: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-xl p-6 mb-6 border border-dark-800">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
        <Barcode className="h-6 w-6 mr-2 text-primary-500" />
        EAN13 Barcode für Kassensystem
      </h2>
      
      <p className="text-gray-300 mb-4">
        Dieser EAN13-Code wird auf allen gedruckten Belegen angezeigt und kann vom Kassensystem gescannt werden.
      </p>
      
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <label htmlFor="ean13Barcode" className="block text-sm font-medium text-gray-300">
              EAN13 Barcode (13 Ziffern)
            </label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                id="ean13Barcode" 
                value={ean13Barcode}
                onChange={(e) => setEan13Barcode(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="1234567890123"
                className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                disabled={isSaving || backendStatus !== 'connected'}
              />
              <button
                onClick={generateRandomEAN13}
                disabled={isSaving || backendStatus !== 'connected'}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center space-x-2"
                title="Generate random EAN13 code"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Generate</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-dark-800 p-4 rounded-md">
            <div>
              <p className="text-gray-200 font-mono text-lg">{appSettings?.ean13Barcode || 'Not set'}</p>
              <p className="text-gray-400 text-sm mt-1">Current EAN13 barcode</p>
            </div>
            <button 
              onClick={() => {
                setIsEditing(true);
                setEan13Barcode(appSettings?.ean13Barcode || '');
              }}
              disabled={backendStatus !== 'connected'}
              className={`p-2 rounded-full ${backendStatus !== 'connected' ? 'text-gray-500 cursor-not-allowed' : 'text-primary-400 hover:bg-dark-700'}`}
              aria-label="Edit EAN13 barcode"
            >
              <Barcode className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => {
              setIsEditing(false);
              setEan13Barcode(appSettings?.ean13Barcode || '');
              setMessage(null);
            }}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-md transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || backendStatus !== 'connected'}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-white
              ${isSaving || backendStatus !== 'connected'
                ? 'bg-dark-700 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'}
            `}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {message && (
        <div className={`
          mt-4 p-4 rounded-md flex items-center space-x-2
          ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border border-green-800' : 'bg-red-900/30 text-red-200 border border-red-800'}
        `}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      {backendStatus !== 'connected' && isEditing && (
        <div className="mt-4 p-3 rounded-md bg-red-900/30 text-red-200 border border-red-800">
          <p className="text-sm">
            <strong>Connection Error:</strong> Cannot update EAN13 barcode because you are not connected to Supabase.
            Please check your Supabase credentials in the .env file.
          </p>
        </div>
      )}
      
      <div className="mt-4 bg-dark-800 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Usage:</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• This barcode appears on all printed receipts</li>
          <li>• Cashiers can scan this code for payment processing</li>
          <li>• Must be exactly 13 digits for EAN13 compatibility</li>
          <li>• Use "Generate" to create a valid random code</li>
        </ul>
      </div>
    </div>
  );
};

export default EAN13Settings;