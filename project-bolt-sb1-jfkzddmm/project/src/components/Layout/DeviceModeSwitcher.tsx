import React from 'react';
import { Monitor, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { useDevice } from '../../context/DeviceContext';

const DeviceModeSwitcher: React.FC = () => {
  const { mode, setMode, autoDetectedMode } = useDevice();

  const toggleMode = () => {
    setMode(mode === 'mobile' ? 'desktop' : 'mobile');
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Mode indicator */}
      <div className="hidden sm:flex items-center text-xs text-gray-400">
        <span className="mr-1">Auto:</span>
        <div className="btn-square glass border border-mauve-500/30">
          {autoDetectedMode === 'mobile' ? (
            <Smartphone className="h-3 w-3 text-mauve-400" />
          ) : (
            <Monitor className="h-3 w-3 text-mauve-400" />
          )}
        </div>
      </div>
      
      {/* Toggle button */}
      <button
        onClick={toggleMode}
        className="glass-button btn-rect flex items-center space-x-2 text-white transition-all duration-300 hover:scale-105"
        title={`Switch to ${mode === 'mobile' ? 'desktop' : 'mobile'} mode`}
      >
        {mode === 'mobile' ? (
          <>
            <div className="btn-square glass bg-mauve-500/20 border-mauve-400/30">
              <Smartphone className="h-4 w-4 text-mauve-400" />
            </div>
            <span className="text-sm hidden sm:inline">Mobile</span>
            <ToggleLeft className="h-5 w-5 text-gray-400" />
          </>
        ) : (
          <>
            <div className="btn-square glass bg-blue-500/20 border-blue-400/30">
              <Monitor className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm hidden sm:inline">Desktop</span>
            <ToggleRight className="h-5 w-5 text-mauve-400" />
          </>
        )}
      </button>
    </div>
  );
};

export default DeviceModeSwitcher;