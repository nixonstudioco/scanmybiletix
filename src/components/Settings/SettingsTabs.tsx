import React, { useState } from 'react';
import { Users, Database, Upload, Wrench, Image, Printer } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

// Import existing components
import LogoUpload from './LogoUpload';
import AppNameSettings from './AppNameSettings';
import EAN13Settings from './EAN13Settings';
import FileSystemUpload from './FileSystemUpload';
import CSVUpload from './CSVUpload';
import DatabaseManagement from './DatabaseManagement';
import SupabaseSetup from './SupabaseSetup';
import PrinterSettings from './PrinterSettings';

const SettingsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { backendStatus } = useAppContext();

  const tabs = [
    { id: 'general', label: 'General', icon: Users },
    { id: 'branding', label: 'Logo & Branding', icon: Image },
    { id: 'printer', label: 'Printer', icon: Printer },
    { id: 'data', label: 'Data Import', icon: Upload },
    { id: 'setup', label: 'Setup', icon: Wrench }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {backendStatus === 'connected' && (
              <>
                <AppNameSettings />
                <EAN13Settings />
              </>
            )}
            {backendStatus !== 'connected' && (
              <div className="glass-card border border-red-500/30 rounded-xl p-6">
                <p className="text-red-200">
                  Connect to Supabase to configure general settings.
                </p>
              </div>
            )}
          </div>
        );
      
      case 'branding':
        return (
          <div className="space-y-6">
            {backendStatus === 'connected' && (
              <LogoUpload />
            )}
            {backendStatus !== 'connected' && (
              <div className="glass-card border border-red-500/30 rounded-xl p-6">
                <p className="text-red-200">
                  Connect to Supabase to configure branding settings.
                </p>
              </div>
            )}
          </div>
        );
      
      case 'printer':
        return (
          <div className="space-y-6">
            <PrinterSettings />
          </div>
        );
      
      case 'data':
        return (
          <div className="space-y-6">
            {backendStatus === 'connected' && (
              <>
                <FileSystemUpload />
                <CSVUpload />
              </>
            )}
            {backendStatus !== 'connected' && (
              <div className="glass-card border border-red-500/30 rounded-xl p-6">
                <p className="text-red-200">
                  Connect to Supabase to import ticket data.
                </p>
              </div>
            )}
          </div>
        );
      
      case 'database':
        return (
          <div className="space-y-6">
            {backendStatus === 'connected' && (
              <>
                <DatabaseManagement />
              </>
            )}
            {backendStatus !== 'connected' && (
              <div className="glass-card border border-red-500/30 rounded-xl p-6">
                <p className="text-red-200">
                  Connect to Supabase to manage database settings.
                </p>
              </div>
            )}
          </div>
        );
      
      case 'setup':
        return (
          <div className="space-y-6">
            <SupabaseSetup />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="glass-card rounded-xl border border-mauve-500/20 overflow-hidden">
          <div className="p-6 border-b border-mauve-500/20">
            <h2 className="text-lg font-semibold text-white">Categories</h2>
          </div>
          <nav className="p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-mauve-600 to-mauve-700 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-mauve-500/10'}
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="glass-card rounded-xl border border-mauve-500/20 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsTabs;