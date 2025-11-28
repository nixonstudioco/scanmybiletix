import React, { useState } from 'react';
import { Edit, Save, Check, AlertCircle } from 'lucide-react';
import { supabaseService } from '../../services/supabase';
import { useAppContext } from '../../context/AppContext';

const AppNameSettings: React.FC = () => {
  const { appSettings, refreshAppSettings, backendStatus } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [clubName, setClubName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Update local state when appSettings changes
  React.useEffect(() => {
    setClubName(appSettings?.clubName || 'Famous Summer Club');
  }, [appSettings]);

  const handleSave = async () => {
    if (!clubName.trim()) {
      setMessage({
        text: 'Club name cannot be empty',
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
          clubName: clubName.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await supabaseService.settings.saveSettings({
          ...appSettings,
          clubName: clubName.trim(),
          updatedAt: new Date().toISOString()
        });
      }
      
      setMessage({
        text: 'Club name updated successfully',
        type: 'success'
      });
      
      setIsEditing(false);
      
      // Force refresh app settings from database
      await refreshAppSettings();
      
      // Wait a moment for the refresh to complete then verify the save
      setTimeout(() => {
        if (appSettings?.clubName !== clubName.trim()) {
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
        <Edit className="h-6 w-6 mr-2 text-primary-500" />
        Club Name
      </h2>
      
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <label htmlFor="clubName\" className="block text-sm font-medium text-gray-300">
              Club Name
            </label>
            <input 
              type="text" 
              id="clubName" 
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSaving || backendStatus !== 'connected'}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between bg-dark-800 p-4 rounded-md">
            <p className="text-gray-200 font-medium">{appSettings?.clubName || 'Famous Summer Club'}</p>
            <button 
              onClick={() => setIsEditing(true)}
              disabled={backendStatus !== 'connected'}
              className={`p-2 rounded-full ${backendStatus !== 'connected' ? 'text-gray-500 cursor-not-allowed' : 'text-primary-400 hover:bg-dark-700'}`}
              aria-label="Edit club name"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => {
              setIsEditing(false);
              setClubName(appSettings?.clubName || 'Famous Summer Club');
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
            <strong>Connection Error:</strong> Cannot update club name because you are not connected to Supabase.
            Please check your Supabase credentials in the .env file.
          </p>
        </div>
      )}
    </div>
  );
};

export default AppNameSettings;