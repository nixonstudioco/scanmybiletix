import React, { useState, useEffect } from 'react';
import { Printer, Check, AlertCircle, TestTube, RefreshCw, Server, Zap } from 'lucide-react';
import { isPrintAgentAvailable, tryPrint } from '../../lib/printAgent';
import { ReceiptBuilder } from '../../lib/printService';
import { F_LARGE_BOLD, F_BOLD, fmtDateTime } from '../../lib/escposFormatter';

const PrinterSettings: React.FC = () => {
  const [isCheckingAgent, setIsCheckingAgent] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [agentStatus, setAgentStatus] = useState<{ available: boolean; lastChecked?: Date }>({
    available: false
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    checkAgentStatus();
  }, []);

  const checkAgentStatus = async () => {
    setIsCheckingAgent(true);
    setMessage({ text: 'Verificare agent local...', type: 'info' });

    try {
      const available = await isPrintAgentAvailable(1000);
      setAgentStatus({ available, lastChecked: new Date() });

      if (available) {
        setMessage({
          text: 'Agent local conectat și funcțional!',
          type: 'success'
        });
      } else {
        setMessage({
          text: 'Agentul local nu răspunde. Verificați că rulează pe portul 17620.',
          type: 'error'
        });
      }
    } catch (error) {
      setAgentStatus({ available: false, lastChecked: new Date() });
      setMessage({
        text: `Eroare: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsCheckingAgent(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setMessage({ text: 'Se trimite test de printare...', type: 'info' });

    try {
      const builder = new ReceiptBuilder();

      builder
        .br()
        .center("TEST BILET", F_LARGE_BOLD)
        .br()
        .center("Famous Summer Club Scan", F_BOLD)
        .br()
        .dsep()
        .left(`Data: ${fmtDateTime(new Date())}`)
        .left(`Status: Agent local conectat`)
        .dsep()
        .br()
        .center("Test reusit!")
        .br()
        .br();

      await builder.print({ cut: true, drawer: false });

      setMessage({
        text: 'Test de printare trimis cu succes! Verificați imprimanta.',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: `Test eșuat: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-xl p-6 mb-6 border border-dark-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center text-white">
          <Printer className="h-6 w-6 mr-2 text-primary-500" />
          Setări Printare
        </h2>
      </div>

      <p className="text-gray-300 mb-6">
        Configurare agent local de printare ESC/POS (80mm, 42 caractere/linie).
      </p>

      <div className="mb-6 p-6 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center text-blue-300">
            <Server className="h-5 w-5 mr-2" />
            Agent Local ESC/POS
            {agentStatus.available && <Zap className="h-4 w-4 ml-2 text-yellow-400" />}
          </h3>

          <button
            onClick={checkAgentStatus}
            disabled={isCheckingAgent}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
              ${isCheckingAgent
                ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                : agentStatus.available
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}
            `}
          >
            {isCheckingAgent ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Verificare...</span>
              </>
            ) : agentStatus.available ? (
              <>
                <Check className="h-4 w-4" />
                <span>Conectat</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Verifică</span>
              </>
            )}
          </button>
        </div>

        {agentStatus.available ? (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <h4 className="text-green-300 font-medium mb-2">Agent Activ</h4>
            <div className="text-green-200 text-sm space-y-1">
              <p><strong>Status:</strong> Funcțional</p>
              <p><strong>URL:</strong> http://127.0.0.1:17620</p>
              <p><strong>Token:</strong> Configurat (fbbe3ad2...)</p>
              <p><strong>Format:</strong> ESC/POS 80mm (42 chars)</p>
            </div>
            {agentStatus.lastChecked && (
              <p className="text-green-300 text-xs mt-2">
                Verificat: {fmtDateTime(agentStatus.lastChecked)}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h4 className="text-red-300 font-medium mb-2">Agent Indisponibil</h4>
            <div className="text-red-200 text-sm space-y-2">
              <p>Agentul local nu răspunde. Verificați:</p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Agentul rulează pe portul 17620</li>
                <li>GET /health returnează {JSON.stringify({ok: true})}</li>
                <li>CORS permite origin-ul curent</li>
                <li>Token-ul este corect configurat</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-4 bg-cyan-950/50 rounded-lg p-4 border border-cyan-800/50">
          <h4 className="text-cyan-300 text-sm font-medium mb-2">API Endpoint</h4>
          <div className="text-cyan-200 text-sm space-y-3">
            <div>
              <p className="font-semibold mb-1">Health Check:</p>
              <div className="bg-cyan-900/30 p-2 rounded font-mono text-xs">
                GET http://127.0.0.1:17620/health
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Print Endpoint:</p>
              <div className="bg-cyan-900/30 p-2 rounded font-mono text-xs">
                POST http://127.0.0.1:17620/print/escpos
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Headers:</p>
              <div className="bg-cyan-900/30 p-2 rounded font-mono text-xs">
                Content-Type: application/json<br/>
                X-Print-Token: <<fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27>>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Body Format:</p>
              <div className="bg-cyan-900/30 p-2 rounded font-mono text-xs overflow-x-auto whitespace-pre">
{`{
  "lines": ["line1", "line2", "..."],
  "cut": true,
  "drawer": false
}`}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-950/50 rounded-lg p-4">
          <h4 className="text-blue-300 text-sm font-medium mb-2">Specificații</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>Format: ESC/POS 80mm</li>
            <li>Lățime: 42 caractere/linie</li>
            <li>Comenzi: ESC/POS native (alignment, font)</li>
            <li>Opțiuni: paper cut, cash drawer</li>
            <li>Autentificare: X-Print-Token header</li>
          </ul>
        </div>

        {agentStatus.available && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleTestPrint}
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
                  <span>Se testează...</span>
                </>
              ) : (
                <>
                  <TestTube className="h-5 w-5" />
                  <span>Test Printare</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`
          mt-4 p-4 rounded-md flex items-start space-x-3
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

      <div className="mt-6 bg-dark-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-2">Despre Sistemul de Printare</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>Sistem generic de printare ESC/POS (80mm)</li>
          <li>Comunicare prin agent local HTTP</li>
          <li>Suport pentru orice tip de bilet/bon/etichetă</li>
          <li>Builder modular pentru compoziție liberă</li>
          <li>Zero dependențe de layout-uri predefinite</li>
        </ul>
      </div>
    </div>
  );
};

export default PrinterSettings;
