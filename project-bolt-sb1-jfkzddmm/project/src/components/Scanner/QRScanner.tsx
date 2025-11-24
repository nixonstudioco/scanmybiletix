import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, XCircle } from 'lucide-react';
import { db } from '../../services/db';
import { useAppContext } from '../../context/AppContext';
import { receiptService } from '../../services/receiptService';
import { ScanResult } from '../../types';
import { pwaService } from '../../services/pwaService';
import { webviewLog, isBasicWebView } from '../../utils/webviewCompatibility';

const QRScanner: React.FC = () => {
  const { isScanning, setIsScanning, setLastScanResult, addScan, backendStatus, setFlashColor, appSettings } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  // Initialize scanner
  useEffect(() => {
    webviewLog.log('QRScanner: Initializing scanner...');
    scannerRef.current = new Html5Qrcode(scannerContainerId);
    
    // Get available cameras
    Html5Qrcode.getCameras()
      .then(cameras => {
        webviewLog.log('QRScanner: Found cameras:', cameras.length);
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          setCameraId(cameras[0].id);
        } else {
          setError('No cameras found');
        }
      })
      .catch(err => {
        webviewLog.error('QRScanner: Error accessing camera:', err);
        setError('Error accessing camera: ' + err.message);
      });
      
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => webviewLog.error('QRScanner: Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current || !cameraId) return;
    
    setError(null);
    setIsScanning(true);
    
    try {
      // Request wake lock to prevent screen from sleeping (skip for basic WebView)
      if (!isBasicWebView()) {
        await pwaService.requestWakeLock();
      }
      
      webviewLog.log('QRScanner: Starting camera with ID:', cameraId);
      
      await scannerRef.current.start(
        cameraId,
        {
          fps: isBasicWebView() ? 5 : 10, // Lower FPS for basic WebView
          qrbox: { width: 300, height: 300 },
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      webviewLog.error('QRScanner: Error starting scanner:', err);
      setError('Error starting scanner: ' + (err as Error).message);
      setIsScanning(false);
      if (!isBasicWebView()) {
        await pwaService.releaseWakeLock();
      }
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    
    try {
      await scannerRef.current.stop();
      setIsScanning(false);
      if (!isBasicWebView()) {
        await pwaService.releaseWakeLock();
      }
      webviewLog.log('QRScanner: Scanner stopped successfully');
    } catch (err) {
      webviewLog.error('QRScanner: Error stopping scanner:', err);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Prevent multiple rapid scans
    webviewLog.log('QRScanner: QR code scanned:', decodedText);
    await stopScanner();
    
    try {
      // Step 1-4: Validate ticket (checks database, entriesRemaining, and updates if valid)
      const validationResult = await db.validateTicket(decodedText);
      
      // Step 5: Record scan history (audit trail) - don't let this fail the validation
      try {
        await db.recordScan(
          decodedText, 
          validationResult.valid, 
          validationResult.message
        );
        webviewLog.log('QRScanner: Scan recorded successfully');
      } catch (recordError) {
        webviewLog.error('QRScanner: Failed to record scan (but validation succeeded):', recordError);
        // Don't throw - validation was successful, recording is secondary
      }
      
      // Step 6: Create scan result for UI feedback
      const scanResult: ScanResult = {
        qrCode: decodedText,
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
            .then(() => webviewLog.log("QRScanner: Relay triggered - door/gate opened"))
            .catch(() => webviewLog.warn("QRScanner: Relay error - could not trigger door/gate"));
        } catch (error) {
          webviewLog.warn("QRScanner: Relay API call failed:", error);
        }
        
        // Print receipt for successful scan
        try {
          await printScanReceipt(validationResult.ticket!, decodedText);
        } catch (printError) {
          webviewLog.warn("QRScanner: Receipt printing failed:", printError);
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
      
      // Show notification if supported
      if (!isBasicWebView()) {
        await pwaService.showNotification(
          validationResult.valid ? 'Access Granted' : 'Access Denied',
          {
            body: validationResult.message,
            tag: 'scan-result'
          }
        );
      }
      
      // Wait a moment before allowing new scans
      setTimeout(() => {
        if (scannerRef.current) {
          startScanner();
        }
      }, 2000);
    } catch (error) {
      webviewLog.error('QRScanner: Error processing scan:', error);
      
      // Trigger red background flash for errors
      setFlashColor('red');
      setTimeout(() => setFlashColor(null), 5000);
      
      setError('Error processing scan: Could not connect to Supabase');
      setTimeout(startScanner, 2000);
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
      webviewLog.log("QRScanner: Receipt printed successfully");
    } catch (error) {
      webviewLog.error("QRScanner: Error printing receipt:", error);
      throw error;
    }
  };

  const onScanFailure = (error: string) => {
    // This is called for every frame that doesn't contain a QR code
    // We don't need to do anything here
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = e.target.value;
    if (isScanning) {
      stopScanner().then(() => {
        setCameraId(newCameraId);
        startScanner();
      });
    } else {
      setCameraId(newCameraId);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Wrapper div that contains both the scanner and the overlay */}
      <div className="w-full max-w-lg mb-6 relative">
        {/* Scanner container - keep this clean for Html5Qrcode to use */}
        <div 
          id={scannerContainerId} 
          className="w-full h-96 overflow-hidden rounded-lg shadow-xl bg-black"
        ></div>
        
        {/* Overlay element as a sibling, not a child of the scanner */}
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-4 text-primary-400" />
              <p className="text-lg">Start the scanner to begin</p>
            </div>
          </div>
        )}
        
        {/* Scanning animation overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-1 bg-primary-500 opacity-75 animate-scanner-line"></div>
            <div className="absolute inset-0 rounded-lg border-2 border-primary-500 opacity-50"></div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-lg relative mb-4 w-full max-w-md">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {backendStatus === 'disconnected' && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-4 w-full max-w-md rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-200">
                Cannot scan tickets: Not connected to Supabase backend.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {availableCameras.length > 1 && (
        <div className="mb-4 w-full max-w-md">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Select Camera
          </label>
          <select 
            className="block w-full px-3 py-2 bg-dark-800 border border-dark-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            value={cameraId || ''}
            onChange={handleCameraChange}
            disabled={isScanning}
          >
            {availableCameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex justify-center mt-2">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex items-center space-x-2 bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-bold py-3 px-6 rounded-md transition-colors shadow-lg transform hover:scale-105 transition duration-200"
            disabled={!cameraId || backendStatus !== 'connected'}
          >
            <Camera size={24} />
            <span>Start Scanner</span>
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex items-center space-x-2 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-6 rounded-md transition-colors shadow-lg transform hover:scale-105 transition duration-200"
          >
            <XCircle size={24} />
            <span>Stop Scanner</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;