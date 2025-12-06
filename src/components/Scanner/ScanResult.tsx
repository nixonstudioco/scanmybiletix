import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users, Ticket } from 'lucide-react';
import { ScanResult } from '../../types';

interface ScanResultCardProps {
  result: ScanResult;
}

const ScanResultCard: React.FC<ScanResultCardProps> = ({ result }) => {
  const { success, message, timestamp, ticket, qrCode } = result;
  
  const formattedTime = new Date(timestamp).toLocaleTimeString();

  // Animation effect on mount
  useEffect(() => {
    const element = document.getElementById(`scan-result-${timestamp}`);
    if (element) {
      element.classList.add('animate-appear');
      
      // Remove animation class after it completes
      setTimeout(() => {
        element.classList.remove('animate-appear');
      }, 1000);
    }
  }, [timestamp]);
  
  return (
    <div 
      id={`scan-result-${timestamp}`}
      className={`
        glass-card rounded-2xl shadow-2xl transition-all duration-300
        transform motion-safe:animate-bounce-in overflow-hidden border
        ${success 
          ? 'animate-border-success border-green-500/30' 
          : 'animate-border-error border-red-500/30'}
      `}
    >
      {/* Status Banner */}
      <div 
        className={`
          w-full py-6 px-6 flex items-center justify-center font-bold text-2xl
          ${success 
            ? 'gradient-mauve-light text-white shadow-inner' 
            : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-inner'}
        `}
      >
        {success ? (
          <div className="flex items-center space-x-3">
            <div className="btn-square-lg glass bg-green-500/20 border-green-400/30">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <span>ACCESS GRANTED</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="btn-square-lg glass bg-red-500/20 border-red-400/30">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <span>NO ACCESS</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex flex-col space-y-4">
          <p className={`text-base ${success ? 'text-green-300' : 'text-red-300'}`}>
            {message}
          </p>
          
          {ticket && (
            <div className="glass-card rounded-xl p-4 border border-mauve-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="btn-square glass bg-mauve-500/20 border-mauve-400/30">
                  <Ticket className="h-4 w-4 text-mauve-400" />
                </div>
                <p className="text-sm font-medium text-mauve-300">
                  Ticket Details
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="glass rounded-lg p-3 border border-mauve-500/20">
                  <p className="text-xs text-gray-400 mb-1">Entry Type</p>
                  <p className="text-sm font-semibold text-white">{ticket.entryName}</p>
                </div>
                
                <div className="glass rounded-lg p-3 border border-mauve-500/20">
                  <p className="text-xs text-gray-400 mb-1">Club</p>
                  <p className="text-sm font-semibold text-white">{ticket.club}</p>
                </div>
                
                <div className="glass rounded-lg p-3 border border-mauve-500/20">
                  <p className="text-xs text-gray-400 mb-1">Entries Remaining</p>
                  <p className="text-sm font-semibold text-white flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {ticket.entriesRemaining}
                  </p>
                </div>
                
                <div class="glass rounded-lg p-3 border border-mauve-500/20">
                  <p className="text-xs text-gray-400 mb-1">QR Code</p>
                  <p className="text-sm font-mono px-2 py-1 rounded text-gray-300 truncate">
                    {qrCode}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultCard;