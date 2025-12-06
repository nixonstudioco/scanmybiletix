import React, { useState, useEffect } from 'react';
import { Printer, Check, AlertCircle, TestTube, RefreshCw, Wifi, WifiOff, Monitor, Usb, Zap, Server } from 'lucide-react';
import { printerService, PrinterInfo } from '../../services/printerService';
import { localPrintService } from '../../services/localPrintService';
import { PrintTestButton } from '../PrintTestButton';
import { isPrintAgentAvailable } from '../../lib/printAgent';
import { receiptService } from '../../services/receiptService';

const PrinterSettings: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [localPrintStatus, setLocalPrintStatus] = useState<{ isAvailable: boolean; isConnected: boolean }>({
    isAvailable: false,
    isConnected: false
  });
  const [isCheckingLocalPrint, setIsCheckingLocalPrint] = useState(false);
  const [isDetectingSystemPrinters, setIsDetectingSystemPrinters] = useState(false);
  const [usbPrinters, setUsbPrinters] = useState([]);
  const [connectedUSBPrinter, setConnectedUSBPrinter] = useState(null);
  const [webUSBEnabled, setWebUSBEnabled] = useState(false);
  const [selectedUSBPort, setSelectedUSBPort] = useState('');
  const [isWebUSBSupported, setIsWebUSBSupported] = useState(false);
  const [qzStatus, setQzStatus] = useState({ isConnected: false });

  useEffect(() => {
    loadPrinters();
    checkLocalPrintStatus();
  }, []);

  const checkLocalPrintStatus = async () => {
    try {
      const isConnected = await isPrintAgentAvailable(800);
      setLocalPrintStatus({
        isAvailable: isConnected,
        isConnected: isConnected
      });
    } catch (error) {
      console.error('Error checking local print status:', error);
      setLocalPrintStatus({ isAvailable: false, isConnected: false });
    }
  };

  const handleCheckLocalPrintServer = async () => {
    setIsCheckingLocalPrint(true);
    setMessage({ text: 'Se verifică agentul local de printare...', type: 'info' });

    try {
      const isConnected = await isPrintAgentAvailable(800);
      setLocalPrintStatus({
        isAvailable: isConnected,
        isConnected: isConnected
      });
      
      if (isConnected) {
        setMessage({
          text: 'Agentul local de printare este disponibil! Printarea directă este activă.',
          type: 'success'
        });
      } else {
        setMessage({
          text: 'Agentul local de printare nu este disponibil. Verificați că este pornit pe portul 17620.',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: `Eroare la verificarea serverului: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsCheckingLocalPrint(false);
    }
  };

  const handleTestLocalPrint = async () => {
    setIsTesting(true);
    setMessage({ text: 'Se testează agentul local de printare...', type: 'info' });

    try {
      await localPrintService.testPrint();
      setMessage({
        text: 'Test de printare reușit! Verificați imprimanta pentru biletul de test.',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Test de printare eșuat: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsTesting(false);
    }
  };
  const loadPrinters = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const availablePrinters = await printerService.getAvailablePrinters();
      setPrinters(availablePrinters);
      
      const currentPrinter = printerService.getSelectedPrinter();
      if (currentPrinter) {
        setSelectedPrinter(currentPrinter);
      } else if (availablePrinters.length > 0) {
        const defaultPrinter = availablePrinters.find(p => p.isDefault) || availablePrinters[0];
        setSelectedPrinter(defaultPrinter.id);
        printerService.selectPrinter(defaultPrinter.id);
      }
      
      // Count system vs generic printers
      const systemPrinters = availablePrinters.filter(p => p.isSystemPrinter);
      const genericPrinters = availablePrinters.filter(p => !p.isSystemPrinter);
      const qzPrinters = availablePrinters.filter(p => p.isQZTrayPrinter);
      
      setMessage({
        text: `Găsite ${availablePrinters.length} imprimante disponibile (${systemPrinters.length} sistem, ${qzPrinters.length} QZ Tray, ${genericPrinters.length} generice)`,
        type: 'info'
      });
    } catch (error) {
      setMessage({
        text: `Eroare la încărcarea imprimantelor: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectSystemPrinters = async () => {
    setIsDetectingSystemPrinters(true);
    setMessage({ 
      text: 'Se detectează imprimantele instalate în sistem...', 
      type: 'info' 
    });

    try {
      // Force refresh of system printers
      const systemPrinters = await printerService.refreshPrinters();
      setPrinters(systemPrinters);
      
      const detectedSystemPrinters = systemPrinters.filter(p => p.isSystemPrinter);
      
      if (detectedSystemPrinters.length > 0) {
        setMessage({
          text: `Detectate ${detectedSystemPrinters.length} imprimante de sistem!`,
          type: 'success'
        });
      } else {
        setMessage({
          text: 'Nu au fost detectate imprimante de sistem. Browser-ul are acces limitat la imprimantele sistemului.',
          type: 'info'
        });
      }
    } catch (error) {
      setMessage({
        text: `Eroare la detectarea imprimantelor de sistem: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsDetectingSystemPrinters(false);
    }
  };

  const loadUSBPrinters = async () => {
    try {
      const connectedPrinters = await webUSBPrinterService.getConnectedPrinters();
      setUsbPrinters(connectedPrinters);
      
      // Check if already connected to a printer
      if (webUSBPrinterService.isConnectedToPrinter()) {
        const connectedPrinter = connectedPrinters.find(p => p.isConnected);
        setConnectedUSBPrinter(connectedPrinter || null);
      }
    } catch (error) {
      console.error('Error loading USB printers:', error);
    }
  };

  const handleRequestUSBPrinter = async () => {
    try {
      setMessage({ text: 'Se cere accesul la imprimanta USB...', type: 'info' });
      
      const device = await webUSBPrinterService.requestPrinter();
      if (device) {
        await webUSBPrinterService.connectToPrinter(device);
        await loadUSBPrinters();
        
        setMessage({
          text: `Conectat cu succes la imprimanta USB: ${device.productName}`,
          type: 'success'
        });
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Handle specific WebUSB access denied error
      if (errorMessage.includes('Access denied') || errorMessage.includes('open')) {
        setMessage({
          text: `Eroare la conectarea imprimantei USB: ${errorMessage}`,
          type: 'error'
        });
      } else {
        setMessage({
          text: `Eroare la conectarea imprimantei USB: ${(error as Error).message}`,
          type: 'error'
        });
      }
    }
  };

  const handleConnectUSBPrinter = async (printer) => {
    try {
      setMessage({ text: 'Se conecteaza la imprimanta USB...', type: 'info' });
      
      await webUSBPrinterService.connectToPrinter(printer.device);
      setConnectedUSBPrinter(printer);
      
      // Enable WebUSB printing in receipt service
      receiptService.setWebUSBEnabled(true);
      setWebUSBEnabled(true);
      
      setMessage({
        text: `Conectat cu succes la: ${printer.name}`,
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Eroare la conectare: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleDisconnectUSBPrinter = async () => {
    try {
      await webUSBPrinterService.disconnectFromPrinter();
      setConnectedUSBPrinter(null);
      
      // Disable WebUSB printing
      receiptService.setWebUSBEnabled(false);
      setWebUSBEnabled(false);
      
      setMessage({
        text: 'Deconectat de la imprimanta USB',
        type: 'success'
      });
      
      await loadUSBPrinters();
    } catch (error) {
      setMessage({
        text: `Eroare la deconectare: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleTestUSBPrint = async () => {
    if (!connectedUSBPrinter) {
      setMessage({
        text: 'Nu exista imprimanta USB conectata',
        type: 'error'
      });
      return;
    }

    setIsTesting(true);
    setMessage({ text: 'Se testeaza imprimanta USB...', type: 'info' });

    try {
      await webUSBPrinterService.testPrint();
      setMessage({
        text: 'Test de printare USB reusit! Verificati imprimanta.',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Test de printare USB esuat: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePrinterSelect = (printerId: string) => {
    setSelectedPrinter(printerId);
    printerService.selectPrinter(printerId).then(() => {
      const printer = printers.find(p => p.id === printerId);
      setMessage({
        text: `Imprimanta "${printer?.name}" a fost selectată și salvată în baza de date`,
        type: 'success'
      });
    }).catch(error => {
      setMessage({
        text: `Eroare la salvarea setărilor: ${error.message}`,
        type: 'error'
      });
    });
  };

  const handleUSBPortSelect = (port: string) => {
    setSelectedUSBPort(port);
    printerService.setUSBPort(port);
    setMessage({
      text: `Port USB setat la: ${port}`,
      type: 'success'
    });
  };

  const handleRefreshPrinters = async () => {
    setIsRefreshing(true);
    setMessage({
      text: 'Se actualizează lista de imprimante...',
      type: 'info'
    });
    
    try {
      const refreshedPrinters = await printerService.refreshPrinters();
      setPrinters(refreshedPrinters);
      setMessage({
        text: 'Lista de imprimante a fost actualizată',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Eroare la actualizarea imprimantelor: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsRefreshing(false);
    }
    
    // Also refresh USB printers
    if (isWebUSBSupported) {
      await loadUSBPrinters();
    }
    
    // Also refresh USB ports
    await loadUSBPorts();
  };

  const loadUSBPorts = async () => {
    // Implementation for loading USB ports
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      setMessage({
        text: 'Vă rugăm să selectați mai întâi o imprimantă',
        type: 'error'
      });
      return;
    }

    setIsTesting(true);
    setMessage({
      text: 'Se testează imprimanta...',
      type: 'info'
    });

    try {
      await printerService.testPrint();
      setMessage({
        text: 'Test de printare reușit! Verificați imprimanta.',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Test de printare eșuat: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getPrinterStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'busy': return 'text-yellow-400';
      case 'unknown': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getPrinterStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Gata';
      case 'offline': return 'Offline';
      case 'busy': return 'Ocupată';
      case 'unknown': return 'Necunoscut';
      default: return 'Necunoscut';
    }
  };

  const getPrinterIcon = (printer: PrinterInfo) => {
    if (printer.isNetworkPrinter) {
      return printer.status === 'offline' ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getPrinterTypeText = (printer: PrinterInfo) => {
    if (printer.isNetworkPrinter) {
      return 'Imprimantă rețea';
    }
    if (printer.id.includes('thermal')) {
      return 'Imprimantă termică';
    }
    if (printer.id.includes('pos')) {
      return 'Imprimantă POS';
    }
    return 'Imprimantă sistem';
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-xl p-6 mb-6 border border-dark-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center text-white">
          <Printer className="h-6 w-6 mr-2 text-primary-500" />
          Setări Imprimantă
        </h2>
        
        <button
          onClick={handleRefreshPrinters}
          disabled={isRefreshing || isLoading}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
            ${isRefreshing || isLoading
              ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
              : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}
          `}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualizează</span>
        </button>
      </div>
      
      <p className="text-gray-300 mb-6">
        Configurați printarea biletelor. Se folosește serverul local pentru printare directă.
      </p>
      
      {/* Local Print Server Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center text-blue-300">
            <Server className="h-5 w-5 mr-2" />
            Agent Local de Printare
            {localPrintStatus.isConnected && <Zap className="h-4 w-4 ml-2 text-yellow-400" />}
          </h3>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCheckLocalPrintServer}
              disabled={isCheckingLocalPrint}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
                ${isCheckingLocalPrint
                  ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                  : localPrintStatus.isConnected
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}
              `}
            >
              {isCheckingLocalPrint ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Verificare...</span>
                </>
              ) : localPrintStatus.isConnected ? (
                <div className="flex items-center space-x-2 text-green-300">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Conectat</span>
                </div>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Verifică Agent</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {localPrintStatus.isConnected ? (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <h4 className="text-green-300 font-medium mb-2">✅ Agent Local Conectat</h4>
            <div className="text-green-200 text-sm space-y-1">
              <p><strong>Status:</strong> Activ și funcțional</p>
              <p><strong>URL:</strong> http://127.0.0.1:17620</p>
              <p><strong>Endpoints:</strong> /health, /print/escpos</p>
              <p><strong>Token:</strong> Configurat</p>
            </div>
            <div className="mt-3 flex items-center space-x-2 text-xs">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-yellow-300 font-medium">PRINTARE DIRECTĂ ACTIVĂ</span>
              <span className="text-gray-400">- Toate biletele se printează direct fără dialoguri</span>
            </div>
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h4 className="text-red-300 font-medium mb-2">❌ Agent Local Nu Este Disponibil</h4>
            <div className="text-red-200 text-sm space-y-2">
              <p>Agentul local de printare nu răspunde. Pentru printare directă:</p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Asigurați-vă că agentul local rulează pe portul 17620</li>
                <li>Verificați că API-ul este accesibil la http://127.0.0.1:17620</li>
                <li>Verificați că endpoint-ul GET /health returnează {JSON.stringify({ok: true})}</li>
                <li><strong>CORS:</strong> Adăugați 'https://http://scan.mybiletix.ro' în CORS allowed origins</li>
                <li>Testați din nou conexiunea</li>
              </ol>
            </div>
          </div>
        )}
        
        <div className="mt-4 bg-blue-950/50 rounded-lg p-4">
          <h4 className="text-blue-300 text-sm font-medium mb-2">🚀 Avantajele Agentului Local:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• ⚡ Printare directă - ZERO dialoguri</li>
            <li>• 🖨️ Control total asupra imprimantei</li>
            <li>• 📏 Comenzi ESC/POS native</li>
            <li>• 🎯 Performanță maximă</li>
            <li>• 🔒 Securitate prin token</li>
            <li>• 🩺 Health check la /health</li>
          </ul>
        </div>
        
        <div className="mt-4 bg-amber-950/50 rounded-lg p-4 border border-amber-800/50">
          <h4 className="text-amber-300 text-sm font-medium mb-2">⚠️ Configurare CORS:</h4>
          <div className="text-amber-200 text-sm space-y-2">
            <p><strong>Important:</strong> Agentul local trebuie configurat să permită cereri de la:</p>
            <div className="bg-amber-900/30 p-2 rounded font-mono text-xs">
              https://scan.melidom.ro
            </div>
            <p>Verificați configurația CORS în agentul local pentru a permite acest origin.</p>
          </div>
        </div>
        
        <div className="mt-4 bg-red-950/50 rounded-lg p-4 border border-red-800/50">
          <h4 className="text-red-300 text-sm font-medium mb-2">🔑 Configurare Token:</h4>
          <div className="text-red-200 text-sm space-y-2">
            <p><strong>Token curent în aplicație:</strong></p>
            <div className="bg-red-900/30 p-2 rounded font-mono text-xs break-all">
              &lt;&lt;fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27&gt;&gt;
            </div>
            <p><strong>Asigurați-vă că:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Agentul local folosește exact acest token</li>
              <li>Token-ul este configurat în header-ul X-Print-Token</li>
              <li>Nu există spații sau caractere suplimentare</li>
            </ul>
            <p className="text-red-300 font-semibold">Dacă primiți eroarea "401 Unauthorized", token-ul nu se potrivește!</p>
          </div>
        </div>
      
        {/* Test Print Button */}
        {localPrintStatus.isConnected && (
          <div className="flex justify-center space-x-4">
            <PrintTestButton token="<<fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27>>" />
            
            <button
              onClick={handleTestLocalPrint}
              disabled={isTesting}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium
                ${isTesting
                  ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'}
              `}
            >
              {isTesting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Se testează printarea...</span>
                </>
              ) : (
                <>
                  <TestTube className="h-5 w-5" />
                  <span>Test Bilet Complet</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mr-3"></div>
          <span className="text-gray-300">Se detectează imprimantele...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-3">Imprimante Browser</h3>
          
          {printers.length === 0 ? (
            <div className="text-center py-8">
              <Printer className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Se detectează imprimantele...</p>
              <p className="text-gray-500 text-sm mb-4">
                Dacă nu vezi imprimantele tale, încearcă să reîmprospătezi lista.
              </p>
              <p className="text-gray-500 text-sm">
                Browser-ul are acces limitat la imprimantele sistemului din motive de securitate.
              </p>
              <button
                onClick={handleRefreshPrinters}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
              >
                Reîncercă detectarea
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedPrinter === printer.id
                        ? 'border-primary-500 bg-primary-900/30 shadow-lg'
                        : printer.status === 'offline'
                          ? 'border-red-700 bg-red-900/20 hover:border-red-600'
                          : 'border-dark-700 bg-dark-800 hover:border-primary-600'}
                    `}
                    onClick={() => handlePrinterSelect(printer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Selection Radio */}
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${selectedPrinter === printer.id
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-600'}
                        `}>
                          {selectedPrinter === printer.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        
                        {/* Printer Icon */}
                        <div className={`${getPrinterStatusColor(printer.status)}`}>
                          {getPrinterIcon(printer)}
                        </div>
                        
                        {/* Printer Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium">{printer.name}</h3>
                            {printer.isDefault && (
                              <span className="bg-primary-900/50 text-primary-300 px-2 py-0.5 rounded text-xs">
                                Implicită
                              </span>
                            )}
                            {printer.isSystemPrinter && (
                              <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-xs">
                                Sistem
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm mt-1">
                            <span className={getPrinterStatusColor(printer.status)}>
                              {getPrinterStatusText(printer.status)}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">
                              {getPrinterTypeText(printer)}
                            </span>
                            {printer.portName && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-400">{printer.portName}</span>
                              </>
                            )}
                          </div>
                          
                          {printer.description && (
                            <p className="text-gray-500 text-xs mt-1">
                              {printer.description}
                            </p>
                          )}
                          
                          {printer.driverName && (
                            <p className="text-gray-500 text-xs mt-1">
                              Driver: {printer.driverName}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {selectedPrinter === printer.id && (
                        <Check className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleTestPrint}
                  disabled={!selectedPrinter || isTesting}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md font-medium
                    ${!selectedPrinter || isTesting
                      ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'}
                  `}
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Se testează...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      <span>Test Print</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRefreshPrinters}
                  disabled={isRefreshing}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md font-medium
                    ${isRefreshing
                      ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                      : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}
                  `}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Actualizează Lista</span>
                </button>
                
                <button
                  onClick={handleDetectSystemPrinters}
                  disabled={isDetectingSystemPrinters}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md font-medium
                    ${isDetectingSystemPrinters
                      ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'}
                  `}
                >
                  <Monitor className="h-4 w-4" />
                  <span>Sistem PC</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {message && (
        <div className={`
          mt-6 p-4 rounded-md flex items-start space-x-3
          ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border border-green-800' :
            message.type === 'error' ? 'bg-red-900/30 text-red-200 border border-red-800' :
            'bg-blue-900/30 text-blue-200 border border-blue-800'}
        `}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Printer className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      {/* Info Section */}
      <div className="mt-6 space-y-4">
        {webUSBEnabled && connectedUSBPrinter && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-300 mb-2">🚀 Modul WebUSB Activ:</h3>
            <p className="text-sm text-green-200">
              Toate biletele se vor printa direct pe imprimanta USB <strong>{connectedUSBPrinter.name}</strong> 
              fără dialog de printare. Pentru a reveni la printarea browser, deconectați imprimanta USB.
            </p>
          </div>
        )}
        
        <div className="bg-dark-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-2">Limitări browser:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Browser-ele au acces limitat la imprimantele sistemului din motive de securitate</li>
            <li>• Printarea se face prin dialogul de printare al sistemului</li>
            <li>• Pentru acces direct la imprimante, folosiți WebUSB (Chrome/Edge)</li>
            <li>• Imprimantele sistem pot fi detectate doar în anumite browsere</li>
          </ul>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-2">Pentru cea mai bună experiență:</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• 🚀 Folosiți WebUSB pentru printare directă (Chrome/Edge pe desktop)</li>
            <li>• Asigurați-vă că imprimanta este pornită și conectată</li>
            <li>• Pentru imprimante termice, conectați prin USB și folosiți WebUSB</li>
            <li>• Testați printarea înainte de scanarea biletelor</li>
          </ul>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-2">Imprimante compatibile WebUSB:</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• 🖨️ Epson TM-T20, TM-T82, TM-T88V</li>
            <li>• ⭐ Star TSP100, TSP650</li>
            <li>• 🏪 Citizen CT-S310</li>
            <li>• 👥 Brother TD-2020</li>
            <li>• 🔧 Imprimante termice generice (58mm/80mm)</li>
          </ul>
        </div>
        
        {selectedPrinter && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-300 mb-2">Imprimantă browser selectată:</h3>
            <div className="text-sm text-green-200">
              <p><strong>Nume:</strong> {printers.find(p => p.id === selectedPrinter)?.name}</p>
              <p><strong>Tip:</strong> {printers.find(p => p.id === selectedPrinter)?.isQZTrayPrinter ? 'QZ Tray' : 
                printers.find(p => p.id === selectedPrinter)?.isSystemPrinter ? 'Sistem' : 'Generic'}</p>
              <p><strong>Status:</strong> {getPrinterStatusText(printers.find(p => p.id === selectedPrinter)?.status || 'unknown')}</p>
              {printers.find(p => p.id === selectedPrinter)?.portName && (
                <p><strong>Port:</strong> {printers.find(p => p.id === selectedPrinter)?.portName}</p>
              )}
              {selectedUSBPort && (
                <p><strong>Port USB configurat:</strong> {selectedUSBPort}</p>
              )}
            </div>
          </div>
        )}
        
        {qzStatus.isConnected && (
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-emerald-300 mb-2">☕ QZ Tray Activ:</h3>
            <p className="text-sm text-emerald-200 mb-2">
              🚀 <strong>Mod QZ Tray Exclusiv Activ:</strong> Toate biletele se vor printa DIRECT pe imprimantele QZ Tray 
              fără niciun dialog de printare sau confirmări.
            </p>
            <div className="bg-emerald-950/50 rounded p-3 mt-2">
              <div className="text-xs text-emerald-300 space-y-1">
                <div>• ✅ Semnătură digitală configurată</div>
                <div>• ✅ Printare automată fără dialoguri</div>
                <div>• ✅ Acces direct la toate imprimantele sistem</div>
                <div>• ✅ Suport ESC/POS pentru imprimante termice</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-2">💡 Pentru detectarea completă a imprimantelor:</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• ☕ <strong>QZ Tray (Recomandat):</strong> Instalați QZ Tray pentru cel mai bun acces la imprimante</li>
            <li>• ☕ <strong>QZ Tray</strong> - Cea mai bună opțiune pentru acces direct la imprimante</li>
            <li>• 🔍 Folosiți butonul "Detectează Imprimante Sistem" pentru imprimante Windows</li>
            <li>• 🔌 Configurați portul USB manual pentru conexiuni specifice</li>
            <li>• 🖨️ Pentru imprimante termice: conectați USB și folosiți WebUSB</li>
            <li>• 🌐 Pentru imprimante de rețea: selectați portul TCP/IP</li>
          </ul>
        </div>
        
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-300 mb-2">⚠️ Notă despre detectarea imprimantelor sistem:</h3>
          <p className="text-sm text-amber-200">
            <strong>QZ Tray</strong> oferă cea mai bună soluție pentru accesul la imprimante, evitând limitările browser-ului.
            Din motive de securitate, browser-ele web au acces foarte limitat la imprimantele sistemului.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrinterSettings;