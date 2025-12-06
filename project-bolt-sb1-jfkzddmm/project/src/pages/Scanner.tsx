import React, { useEffect } from 'react';
import { ScanLine } from 'lucide-react';
import QRScanner from '../components/Scanner/QRScanner';
import DesktopScanner from '../components/Scanner/DesktopScanner';
import ScanResultCard from '../components/Scanner/ScanResult';
import RecentScans from '../components/Scanner/RecentScans';
import { useAppContext } from '../context/AppContext';
import { useDevice } from '../context/DeviceContext';
import { supabaseService } from '../services/supabase';

const Scanner: React.FC = () => {
  const { lastScanResult, ticketsCount, backendStatus, appSettings } = useAppContext();
  const { mode } = useDevice();

  const clubName = appSettings?.clubName || 'Famous Summer Club';
  const projectInfo = supabaseService.getProjectInfo();

  useEffect(() => {
    // Update the page title dynamically
    document.title = `${clubName} Scan`;
  }, [clubName]);

  return (
    <div className="flex flex-col items-center">
      {/* Database Warning */}
      {!projectInfo.isValid && backendStatus === 'connected' && (
        <div className="glass-card border-l-4 border-red-500 p-6 mb-6 w-full max-w-2xl rounded-2xl border border-red-500/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="btn-square glass bg-red-500/20 border-red-400/30">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-200">
                <strong>Shared Database Warning:</strong> You're connected to a shared/demo database. 
                This may show tickets from other users. Please create your own Supabase project and update your .env file with your own credentials.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {backendStatus !== 'connected' ? (
        <div className="glass-card border-l-4 border-red-500 p-6 mb-6 w-full max-w-2xl rounded-2xl border border-red-500/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="btn-square glass bg-red-500/20 border-red-400/30">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-200">
                <strong>Not connected to Supabase.</strong> Please check your credentials in the .env file and go to Settings to configure the database.
              </p>
            </div>
          </div>
        </div>
      ) : ticketsCount === 0 ? (
        <div className="glass-card border-l-4 border-amber-500 p-6 mb-6 w-full max-w-2xl rounded-2xl border border-amber-500/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="btn-square glass bg-amber-500/20 border-amber-400/30">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-200">
                No tickets found in database. Please go to Settings to import tickets.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Render appropriate scanner based on device mode */}
      {mode === 'mobile' ? <QRScanner /> : <DesktopScanner />}
      
      {lastScanResult && (
        <div className="w-full max-w-2xl mt-6 animate-appear">
          <h2 className="text-lg font-medium text-gray-100 mb-2">Last Scan</h2>
          <ScanResultCard result={lastScanResult} />
        </div>
      )}
    </div>
  );
};

export default Scanner;