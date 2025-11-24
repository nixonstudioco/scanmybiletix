import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Download } from 'lucide-react';
import { importTickets, generateCSVTemplate } from '../../services/csvService';
import { useAppContext } from '../../context/AppContext';

const CSVUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshTicketsCount, backendStatus } = useAppContext();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's a CSV file
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setMessage({
        text: 'Please upload a CSV file',
        type: 'error'
      });
      return;
    }
    
    setIsUploading(true);
    setMessage({
      text: 'Uploading and processing file...',
      type: 'info'
    });
    
    try {
      // Check if we're connected to Supabase first
      if (backendStatus !== 'connected') {
        throw new Error('Not connected to Supabase. Please check your credentials and try again.');
      }
      
      const result = await importTickets(file);
      
      if (result.success) {
        setMessage({
          text: result.message,
          type: 'success'
        });
        // Refresh the ticket count in the app context
        refreshTicketsCount();
      } else {
        setMessage({
          text: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: `Error: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    try {
      const csvBlob = generateCSVTemplate();
      const url = URL.createObjectURL(csvBlob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ticket-template.csv';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({
        text: 'Template downloaded successfully',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Error downloading template: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-xl p-6 mb-6 border border-dark-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Import Tickets</h2>
      
      <p className="text-gray-300 mb-4">
        Upload a CSV file containing QR codes and ticket information. The CSV should have the following columns:
      </p>
      
      <div className="bg-dark-800 p-3 rounded mb-4 font-mono text-sm text-gray-300">
        <code>qrCode, entryName, entriesRemaining, club</code>
      </div>
      
      <div className="flex space-x-3 mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center justify-center space-x-2 py-2 px-4 
                   bg-dark-800 text-gray-300 hover:bg-dark-700
                   border border-dark-700 rounded-lg transition-colors"
        >
          <Download className="h-5 w-5" />
          <span>Download Template</span>
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        
        <button
          onClick={triggerFileInput}
          disabled={isUploading || backendStatus !== 'connected'}
          className={`
            flex-1 flex items-center justify-center space-x-2 py-2 px-4 
            border rounded-lg transition-colors
            ${isUploading || backendStatus !== 'connected'
              ? 'bg-dark-800 text-gray-500 border-dark-700 cursor-not-allowed' 
              : 'border-primary-700 bg-primary-600 text-white hover:bg-primary-700'}
          `}
        >
          {isUploading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Upload CSV File</span>
            </>
          )}
        </button>
      </div>
      
      {message && (
        <div className={`
          p-4 rounded-md flex items-start space-x-3
          ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border border-green-800' : 
            message.type === 'error' ? 'bg-red-900/30 text-red-200 border border-red-800' : 
            'bg-blue-900/30 text-blue-200 border border-blue-800'}
        `}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <FileText className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      {backendStatus !== 'connected' && (
        <div className="mt-4 p-4 rounded-md bg-red-900/30 text-red-200 border border-red-800">
          <p className="text-sm">
            <strong>Connection Error:</strong> Cannot upload tickets because you are not connected to Supabase. 
            Please check your Supabase credentials in the .env file and ensure the database tables are created.
          </p>
        </div>
      )}
      
      <div className="mt-5 pt-5 border-t border-dark-700">
        <h3 className="text-sm font-medium text-gray-300 mb-2">CSV Format Example:</h3>
        <pre className="bg-dark-800 p-3 rounded text-xs overflow-x-auto text-gray-300">
          qrCode,entryName,entriesRemaining,club<br />
          ABC123,Regular Entry,1,Capricci<br />
          XYZ456,VIP Access,3,Intooit<br />
          DEF789,Backstage Pass,2,Capricci
        </pre>
      </div>
    </div>
  );
};

export default CSVUpload;