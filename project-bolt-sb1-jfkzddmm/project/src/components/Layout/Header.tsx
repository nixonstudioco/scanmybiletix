import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, QrCode, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { supabaseService } from '../../services/supabase';

const Header: React.FC = () => {
  const location = useLocation();
  const { ticketsCount, backendStatus, appSettings } = useAppContext();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [logoError, setLogoError] = useState(false);
  
  const clubName = appSettings?.clubName || 'Famous Summer Club';
  const projectInfo = supabaseService.getProjectInfo();
  
  // Debug logo loading
  useEffect(() => {
    console.log('Header: appSettings:', appSettings);
    console.log('Header: logoUrl:', appSettings?.logoUrl);
    setLogoError(false); // Reset error when settings change
  }, [appSettings]);

  const handleLogoClick = () => {
    const now = Date.now();
    
    // Reset click count if more than 2 seconds have passed since last click
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(now);
    
    // Redirect to admin dashboard after 6 clicks
    if (clickCount + 1 >= 6) {
      setClickCount(0);
      window.location.href = '/settings';
    }
  };

  const handleLogoError = () => {
    console.error('Header: Logo failed to load:', appSettings?.logoUrl);
    setLogoError(true);
  };

  const handleLogoLoad = () => {
    console.log('Header: Logo loaded successfully:', appSettings?.logoUrl);
    setLogoError(false);
  };

  return (
    <header className="glass-card border-b border-mauve-500/20 shadow-mauve-glow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <button onClick={handleLogoClick} className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
            {appSettings?.logoUrl && !logoError ? (
              <div className="glass rounded-lg p-2 hover:glass-hover">
                <img 
                  src={appSettings.logoUrl} 
                  alt={`${clubName} Logo`}
                  className="h-10 w-auto rounded"
                  onError={handleLogoError}
                  onLoad={handleLogoLoad}
                  style={{ maxWidth: '200px' }}
                />
              </div>
            ) : (
              <div className="glass rounded-lg p-2 hover:glass-hover">
                <QrCode className="h-9 w-9 text-mauve-500" />
              </div>
            )}
            <span className="text-xl font-bold text-white hidden sm:block">{clubName} Scan</span>
          </button>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-20 left-4 bg-black/80 text-white p-2 rounded text-xs z-50">
              <div>logoUrl: {appSettings?.logoUrl || 'null'}</div>
              <div>logoError: {logoError.toString()}</div>
              <div>appSettings: {appSettings ? 'loaded' : 'null'}</div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {backendStatus !== 'checking' && (
              <div className={`btn-square glass border ${
                !projectInfo.isValid 
                  ? 'border-red-500/50 bg-red-500/10' 
                  : 'border-mauve-500/30'
              }`}>
                {backendStatus === 'connected' ? (
                  !projectInfo.isValid ? (
                    <AlertTriangle className="h-5 w-5 text-red-400" title="Connected to shared/demo database - may show other users' data" />
                  ) : (
                    <Cloud className="h-5 w-5 text-green-400" title="Connected to your Supabase database" />
                  )
                ) : (
                  <CloudOff className="h-5 w-5 text-red-400" title="Not Connected to Supabase" />
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;