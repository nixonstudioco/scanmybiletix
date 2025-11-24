import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { receiptService } from '../../services/receiptService';
import { ScanResult } from '../../types';
import { db } from '../../services/db';
import { webviewLog } from '../../utils/webviewCompatibility';

const DesktopScanner: React.FC = () => {
  const { setLastScanResult, addScan, backendStatus, appSettings, setFlashColor } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedCode, setLastProcessedCode] = useState<string>('');
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clubName = appSettings?.clubName || 'Famous Summer Club';

  // Keep input focused
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus on mount
    focusInput();

    // Re-focus if lost (every 100ms)
    const interval = setInterval(focusInput, 100);

    // Focus on window focus
    window.addEventListener('focus', focusInput);
    document.addEventListener('click', focusInput);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', focusInput);
      document.removeEventListener('click', focusInput);
    };
  }, []);

  const processQRCode = async (qrCode: string) => {
    if (!qrCode.trim() || isProcessing || qrCode === lastProcessedCode) {
      return;
    }

    webviewLog.log('DesktopScanner: Processing QR code:', qrCode);
    setIsProcessing(true);
    setLastProcessedCode(qrCode);


    try {
      // Step 1-4: Validate ticket (checks database, entriesRemaining, and updates if valid)
      const validationResult = await db.validateTicket(qrCode);

      // Step 5: Record scan history (audit trail) - don't let this fail the validation
      try {
        await db.recordScan(
          qrCode,
          validationResult.valid,
          validationResult.message
        );
        webviewLog.log('DesktopScanner: Scan recorded successfully');
      } catch (recordError) {
        webviewLog.error('DesktopScanner: Failed to record scan (but validation succeeded):', recordError);
        // Don't throw - validation was successful, recording is secondary
      }

      // Step 6: Create scan result for UI feedback
      const scanResult: ScanResult = {
        qrCode,
        timestamp: new Date().toISOString(),
        success: validationResult.valid,
        message: validationResult.message,
        ticket: validationResult.ticket
      };

      // Step 7: Provide user feedback
      if (validationResult.valid) {
        // Trigger green background flash
        setFlashColor('green');
        setTimeout(() => setFlashColor(null), 5000);
        
        // Trigger relay for door/gate control
        try {
          fetch("http://localhost:3333/open")
            .then(() => webviewLog.log("DesktopScanner: Relay triggered - door/gate opened"))
            .catch(() => webviewLog.warn("DesktopScanner: Relay error - could not trigger door/gate"));
        } catch (error) {
          webviewLog.warn("DesktopScanner: Relay API call failed:", error);
        }
        
        // Print receipt for successful scan
        try {
          await printScanReceipt(validationResult.ticket!, qrCode);
        } catch (printError) {
          webviewLog.warn("DesktopScanner: Receipt printing failed:", printError);
          // Don't block the scanning flow if printing fails
        }
      } else {
        // Trigger red background flash
        setFlashColor('red');
        setTimeout(() => setFlashColor(null), 5000);
      }

      // Step 8: Update app state with scan result
      setLastScanResult(scanResult);
      addScan(scanResult);

    } catch (error) {
      webviewLog.error('DesktopScanner: Error processing scan:', error);
      
      // Trigger red background flash for errors
      setFlashColor('red');
      setTimeout(() => setFlashColor(null), 5000);
      
      const errorResult: ScanResult = {
        qrCode,
        timestamp: new Date().toISOString(),
        success: false,
        message: 'Error processing scan: Could not connect to Supabase',
      };
      
      setLastScanResult(errorResult);
      addScan(errorResult);
    } finally {
      // Clear processing state after a delay to prevent rapid duplicate scans
      setTimeout(() => {
        setIsProcessing(false);
        setLastProcessedCode('');
      }, 2000);
    }
  };

  const printScanReceipt = async (ticket: any, qrCode: string) => {
    try {
      const receiptData = {
        eventName: `${ticket.club || 'Default Club'} - ${appSettings?.clubName || 'Famous Summer Club'}`,
        eventDate: new Date().toLocaleDateString('ro-RO'),
        paymentMethod: 'CASH' as const, // Default for scanned tickets
        ticketCode: qrCode,
        entryType: ticket.entryName, // Add the ticket type from entryName
        quantity: 1,
        totalAmount: appSettings?.ticketPrice || 50,
        ean13Barcode: appSettings?.ean13Barcode || '1234567890128',
        logoUrl: appSettings?.logoUrl || undefined
      };
      
      // Print receipt with QR code for verification
      await receiptService.printReceipt(receiptData, true);
      webviewLog.log("DesktopScanner: Receipt printed successfully");
    } catch (error) {
      webviewLog.error("DesktopScanner: Error printing receipt:", error);
      throw error;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear existing timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }

    // Set a timeout to process the code if no more input comes
    const timeout = setTimeout(() => {
      if (value.trim()) {
        handleSubmit(value);
      }
    }, 300); // Wait 300ms after last keystroke

    setProcessingTimeout(timeout);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  const handleSubmit = (value: string = inputValue) => {
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      setProcessingTimeout(null);
    }

    if (value.trim() && !isProcessing) {
      processQRCode(value.trim());
      setInputValue(''); // Clear input after processing
    }
  };

  const handleManualSubmit = () => {
    handleSubmit();
  };


  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      {/* Club Logo */}
      <div className="mb-8">
        {appSettings?.logoUrl ? (
          <div className="flex justify-center">
            <div className="glass-card rounded-2xl p-6 shadow-mauve-glow">
              <img 
                src={appSettings.logoUrl} 
                alt={`${clubName} Logo`}
                className="h-24 w-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="glass-card p-8 rounded-2xl shadow-mauve-glow">
              <div className="h-16 w-16 bg-mauve-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-mauve-400">{clubName.charAt(0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {backendStatus !== 'connected' && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 w-full rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-200">
                Cannot scan tickets: Not connected to Supabase backend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="w-full mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            id="qrcode-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isProcessing || backendStatus !== 'connected'}
            placeholder={isProcessing ? 'Processing...' : 'Scan barcode or type QR code here...'}
            className={`
              w-full px-6 py-6 text-xl bg-dark-800 border-2 rounded-xl text-white 
              focus:outline-none focus:ring-2 transition-all duration-200
              ${isProcessing 
                ? 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/50' 
                : backendStatus !== 'connected'
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50 cursor-not-allowed'
                  : 'border-mauve-500/50 focus:border-mauve-500 focus:ring-mauve-500/50'
              }
              ${inputValue ? 'pr-16' : ''}
            `}
            inputMode="none"
            autoFocus={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-6 w-6 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* Manual submit button */}
          {inputValue && !isProcessing && (
            <button
              onClick={handleManualSubmit}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-mauve-600 hover:bg-mauve-700 text-white rounded-lg transition-colors"
              title="Process QR Code (Enter)"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default DesktopScanner;