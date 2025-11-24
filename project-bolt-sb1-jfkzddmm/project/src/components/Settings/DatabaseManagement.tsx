import React, { useState } from 'react';
import { Trash2, AlertTriangle, Check, Info, ExternalLink } from 'lucide-react';
import { db } from '../../services/db';
import { supabaseService } from '../../services/supabase';
import { useAppContext } from '../../context/AppContext';

const DatabaseManagement: React.FC = () => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const { refreshTicketsCount } = useAppContext();

  const projectInfo = supabaseService.getProjectInfo();

  const handleClearData = async () => {
    setIsDeleting(true);
    
    try {
      await db.clearAllData();
      setMessage({
        text: 'All data has been cleared successfully',
        type: 'success'
      });
      // Update ticket count
      refreshTicketsCount();
    } catch (error) {
      setMessage({
        text: `Error clearing data: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-xl p-6 border border-dark-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Database Management</h2>
      
      {/* Database Connection Info */}
      <div className={`mb-6 p-4 rounded-lg border ${
        projectInfo.isValid 
          ? 'bg-blue-900/20 border-blue-800' 
          : 'bg-red-900/30 border-red-800'
      }`}>
        <h3 className={`text-sm font-medium mb-2 flex items-center ${
          projectInfo.isValid ? 'text-blue-300' : 'text-red-300'
        }`}>
          <Info className="h-4 w-4 mr-2" />
          Database Connection
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Project ID:</span>
            <span className={`font-mono ${projectInfo.isValid ? 'text-blue-200' : 'text-red-200'}`}>
              {projectInfo.projectId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ${projectInfo.isValid ? 'text-blue-200' : 'text-red-200'}`}>
              {projectInfo.isValid ? 'Your own database' : 'Shared/demo database'}
            </span>
          </div>
        </div>
        
        {!projectInfo.isValid && (
          <div className="mt-3 pt-3 border-t border-red-800">
            <p className="text-red-200 text-sm font-medium mb-2">
              ⚠️ You're seeing data from other users!
            </p>
            <p className="text-red-200 text-xs">
              To fix this, create your own Supabase project and update the credentials in your .env file.
            </p>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 underline text-xs mt-2"
            >
              Create your own Supabase project <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
      
      <p className="text-gray-300 mb-6">
        {projectInfo.isValid 
          ? 'You can clear all ticket data and scan history from your database. This action cannot be undone.'
          : 'WARNING: This will clear data from a shared database, which may affect other users. Please use your own Supabase project instead.'
        }
      </p>
      
      {!isConfirming ? (
        <button
          onClick={() => setIsConfirming(true)}
          disabled={!projectInfo.isValid}
          className={`
            flex items-center space-x-2 font-medium py-2 px-4 rounded-md transition-colors shadow-md
            ${!projectInfo.isValid
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'}
          `}
        >
          <Trash2 className="h-5 w-5" />
          <span>{projectInfo.isValid ? 'Clear All Data' : 'Cannot Clear Shared Database'}</span>
        </button>
      ) : (
        <div className="border border-red-800 rounded-lg p-5 bg-red-900/30">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-300">Confirm Data Deletion</h3>
              <p className="text-red-200 text-sm mt-1">
                This will permanently delete all tickets and scan history. This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleClearData}
              disabled={isDeleting}
              className={`
                flex items-center space-x-2 py-2 px-4 rounded-md font-medium shadow-md
                ${isDeleting 
                  ? 'bg-dark-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'}
              `}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Yes, Delete Everything</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
              className="py-2 px-4 bg-dark-700 hover:bg-dark-600 text-gray-200 rounded-md font-medium transition-colors shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {message && (
        <div className={`
          mt-4 p-4 rounded-md flex items-center space-x-2
          ${message.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-red-900/30 text-red-300 border border-red-800'}
        `}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagement;