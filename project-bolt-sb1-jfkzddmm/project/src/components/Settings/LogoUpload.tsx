import React, { useState } from 'react';
import { Image, Save, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { supabaseService } from '../../services/supabase';
import { useAppContext } from '../../context/AppContext';

const LogoUpload: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { appSettings, refreshAppSettings, backendStatus } = useAppContext();

  React.useEffect(() => {
    setLogoUrl(appSettings?.logoUrl || '');
  }, [appSettings]);

  const handleSave = async () => {
    if (!logoUrl.trim()) {
      setMessage({
        text: 'Please enter a valid image URL',
        type: 'error'
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(logoUrl.trim());
    } catch {
      setMessage({
        text: 'Please enter a valid URL',
        type: 'error'
      });
      return;
    }

    setIsSaving(true);
    setMessage({
      text: 'Saving logo URL...',
      type: 'info'
    });

    try {
      // Check if we're connected to Supabase first
      if (backendStatus !== 'connected') {
        throw new Error('Not connected to Supabase. Please check your credentials and try again.');
      }

      if (!appSettings) {
        await supabaseService.settings.saveSettings({
          id: 'settings',
          logoUrl: logoUrl.trim(),
          clubName: 'Famous Summer Club',
          ean13Barcode: '1234567890128',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await supabaseService.settings.saveSettings({
          ...appSettings,
          logoUrl: logoUrl.trim(),
          updatedAt: new Date().toISOString()
        });
      }

      setMessage({
        text: 'Logo URL saved successfully',
        type: 'success'
      });

      setIsEditing(false);
      
      // Refresh app settings to show the new logo
      refreshAppSettings();

    } catch (error) {
      setMessage({
        text: `Save failed: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testImageLoad = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleTestImage = async () => {
    if (!logoUrl.trim()) return;

    setMessage({
      text: 'Testing image URL...',
      type: 'info'
    });

    try {
      const isValid = await testImageLoad(logoUrl.trim());
      if (isValid) {
        setMessage({
          text: 'Image URL is valid and loads successfully',
          type: 'success'
        });
      } else {
        setMessage({
          text: 'Image URL could not be loaded. Please check the URL.',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'Error testing image URL',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
        <Image className="h-6 w-6 mr-2 text-primary-500" />
        Club Logo
      </h2>

      {appSettings?.logoUrl && (
        <div className="flex flex-col items-center">
          <div className="p-2 bg-dark-800 rounded-lg mb-3">
            <img 
              src={appSettings.logoUrl} 
              alt="Club Logo" 
              className="h-32 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-sm text-gray-400">Current logo</p>
        </div>
      )}

      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-300">
              Logo Image URL
            </label>
            <div className="flex space-x-2">
              <input 
                type="url" 
                id="logoUrl" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSaving || backendStatus !== 'connected'}
              />
              <button
                onClick={handleTestImage}
                disabled={!logoUrl.trim() || isSaving || backendStatus !== 'connected'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center space-x-2"
                title="Test if image URL loads"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Test</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-dark-800 p-4 rounded-md">
            <div>
              <p className="text-gray-200 font-medium">
                {appSettings?.logoUrl ? 'Logo URL configured' : 'No logo URL set'}
              </p>
              {appSettings?.logoUrl && (
                <p className="text-gray-400 text-sm mt-1 truncate max-w-md">
                  {appSettings.logoUrl}
                </p>
              )}
            </div>
            <button 
              onClick={() => {
                setIsEditing(true);
                setLogoUrl(appSettings?.logoUrl || '');
              }}
              disabled={backendStatus !== 'connected'}
              className={`p-2 rounded-full ${backendStatus !== 'connected' ? 'text-gray-500 cursor-not-allowed' : 'text-primary-400 hover:bg-dark-700'}`}
              aria-label="Edit logo URL"
            >
              <Image className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => {
              setIsEditing(false);
              setLogoUrl(appSettings?.logoUrl || '');
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
          mt-4 p-4 rounded-md border
          ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border-green-800' : 
            message.type === 'error' ? 'bg-red-900/30 text-red-200 border-red-800' : 
            'bg-blue-900/30 text-blue-200 border-blue-800'}
        `}>
          <div className="flex items-start space-x-3">
            {message.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Image className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="mt-6 bg-dark-800 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Enter a direct URL to an image file (PNG, JPG, GIF)</li>
          <li>• Use public image hosting services like Imgur, CloudFlare, or your own server</li>
          <li>• Recommended size: 200x200 pixels or similar square format</li>
          <li>• Use the "Test" button to verify the image loads correctly</li>
          <li>• The logo will appear in the app header and on printed receipts</li>
        </ul>
      </div>

      {backendStatus !== 'connected' && (
        <div className="mt-4 p-4 rounded-md bg-red-900/30 text-red-200 border border-red-800">
          <p className="text-sm">
            <strong>Connection Error:</strong> Cannot update logo URL because you are not connected to Supabase.
            Please check your Supabase credentials and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default LogoUpload;