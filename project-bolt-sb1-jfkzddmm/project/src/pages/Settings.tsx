import React, { useEffect } from 'react';
import { Settings as SettingsIcon, Cloud, CloudOff, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import SettingsTabs from '../components/Settings/SettingsTabs';
import DeviceModeSwitcher from '../components/Layout/DeviceModeSwitcher';

const Settings: React.FC = () => {
  const { isLoading, ticketsCount, backendStatus, appSettings } = useAppContext();
  const clubName = appSettings?.clubName || 'Famous Summer Club';

  useEffect(() => {
    document.title = `Settings - ${clubName} Scan`;
  }, [clubName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="glass-card rounded-xl p-3">
              <SettingsIcon className="h-8 w-8 text-mauve-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">{clubName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Device Mode Switcher */}
            <DeviceModeSwitcher />
            
            {/* Back to Scanner */}
            <Link
              to="/"
              className="btn-square glass-button text-gray-300 hover:text-mauve-400 transition-colors"
              title="Back to scanner"
            >
              <Home className="h-5 w-5" />
            </Link>
            
            {/* Connection Status */}
            <div className={`
              flex items-center space-x-3 glass-card rounded-xl px-4 py-3 border
              ${backendStatus === 'connected' ? 'border-green-500/30' : 
                backendStatus === 'disconnected' ? 'border-red-500/30' : 'border-gray-500/30'}
            `}>
              {backendStatus === 'connected' ? (
                <>
                  <Cloud className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-medium">Connected</span>
                </>
              ) : backendStatus === 'disconnected' ? (
                <>
                  <CloudOff className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-medium">Disconnected</span>
                </>
              ) : (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                  <span className="text-gray-400 font-medium">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Database Status */}
        {!isLoading && (
          <div className="glass-card rounded-xl p-4 mb-8 border border-mauve-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Database Status</h3>
                <p className="text-gray-300 mt-1">
                  {ticketsCount > 0 
                    ? `${ticketsCount} tickets in database` 
                    : backendStatus === 'connected' 
                      ? 'No tickets found - import CSV to add tickets'
                      : 'Database connection required'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-mauve-400">{ticketsCount}</div>
                <div className="text-sm text-gray-400">Tickets</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <SettingsTabs />
      </div>
    </div>
  );
};

export default Settings;