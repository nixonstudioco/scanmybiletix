import React, { useState, useEffect } from 'react';
import { printerService } from '../services/printerService';
import { PrinterDetectionResult } from '../services/printerDetectionService';
import { Printer, Check, X, RefreshCw, Usb } from 'lucide-react';

export const PrinterStatus: React.FC = () => {
  const [detectionResult, setDetectionResult] = useState<PrinterDetectionResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPrinterConnection();
  }, []);

  const checkPrinterConnection = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await printerService.verifyPrinterConnection();
      setDetectionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check printer connection');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestUSBAccess = async () => {
    try {
      const granted = await printerService.requestUSBAccess();
      if (granted) {
        await checkPrinterConnection();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request USB access');
    }
  };

  const getStatusColor = () => {
    if (!detectionResult) return 'bg-gray-100 text-gray-700';
    return detectionResult.isPrinterConnected
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="w-5 h-5 animate-spin" />;
    }
    if (!detectionResult) return <Printer className="w-5 h-5" />;
    return detectionResult.isPrinterConnected ? (
      <Check className="w-5 h-5" />
    ) : (
      <X className="w-5 h-5" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Printer Status</h3>
        <button
          onClick={checkPrinterConnection}
          disabled={isChecking}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className={`${getStatusColor()} rounded-lg p-4 mb-4`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium">
              {detectionResult?.isPrinterConnected ? 'Printer Connected' : 'No Printer Detected'}
            </p>
            <p className="text-sm opacity-90">{detectionResult?.message || 'Checking...'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {detectionResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Detection Method:</span>
              <span className="ml-2 font-medium">{detectionResult.detectionMethod}</span>
            </div>
            <div>
              <span className="text-gray-600">Printers Found:</span>
              <span className="ml-2 font-medium">{detectionResult.printerCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Printing Enabled:</span>
              <span className="ml-2 font-medium">
                {detectionResult.printingEnabled ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {detectionResult.detectedPrinters.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Printers:</h4>
              <div className="space-y-2">
                {detectionResult.detectedPrinters.map((printer, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <Printer className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{printer.name}</p>
                      <p className="text-xs text-gray-600">
                        Type: {printer.type} | Status: {printer.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!detectionResult.isPrinterConnected && navigator.usb && (
            <div className="mt-4">
              <button
                onClick={handleRequestUSBAccess}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 w-full justify-center"
              >
                <Usb className="w-4 h-4" />
                Request USB Device Access
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Click to manually grant access to USB printer devices
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How It Works:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>1. Checks local print agent (thermal printers)</li>
          <li>2. Scans for system printers (desktop/electron)</li>
          <li>3. Detects USB devices (requires permission)</li>
          <li>4. Automatically enables/disables printing based on detection</li>
        </ul>
      </div>
    </div>
  );
};
