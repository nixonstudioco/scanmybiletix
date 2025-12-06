import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ScanResultCard from './ScanResult';

const RecentScans: React.FC = () => {
  const { recentScans, clearRecentScans } = useAppContext();
  
  if (recentScans.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-10 w-full max-w-md">
      <div className="glass-card rounded-2xl p-6 border border-mauve-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-100 flex items-center">
            <div className="btn-square glass bg-mauve-500/20 border-mauve-400/30 mr-2">
              <Clock className="h-5 w-5 text-mauve-400" />
            </div>
            Recent Scans
          </h2>
          
          <button
            onClick={clearRecentScans}
            className="btn-square glass-button text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {recentScans.map((scan, index) => (
            <div 
              key={index} 
              className="transform transition-all duration-200"
              style={{ 
                animationDelay: `${index * 100}ms`, 
                opacity: Math.max(0.5, 1 - (index * 0.1))
              }}
            >
              <ScanResultCard result={scan} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentScans;