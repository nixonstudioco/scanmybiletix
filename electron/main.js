const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;
let isDev = false;

// Check if running in development
if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
  isDev = true;
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// IPC Handlers for printer functionality

// Get system printers using PowerShell (Windows)
ipcMain.handle('get-system-printers', async () => {
  return new Promise((resolve, reject) => {
    if (os.platform() !== 'win32') {
      resolve([]);
      return;
    }

    const command = `powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Location, Comment | ConvertTo-Json"`;
    
    exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting system printers:', error);
        resolve([]);
        return;
      }

      try {
        const printers = JSON.parse(stdout);
        const printerArray = Array.isArray(printers) ? printers : [printers];
        
        const formattedPrinters = printerArray.map(printer => ({
          id: `system-${printer.Name.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: printer.Name,
          driverName: printer.DriverName,
          portName: printer.PortName,
          status: getPrinterStatusFromPS(printer.PrinterStatus),
          location: printer.Location,
          description: printer.Comment,
          isSystemPrinter: true,
          isDefault: false,
          isNetworkPrinter: printer.PortName && printer.PortName.includes('IP'),
          type: 'system'
        }));

        resolve(formattedPrinters);
      } catch (parseError) {
        console.error('Error parsing printer data:', parseError);
        resolve([]);
      }
    });
  });
});

// Get default printer
ipcMain.handle('get-default-printer', async () => {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      resolve(null);
      return;
    }

    const command = `powershell -Command "Get-WmiObject -Class Win32_Printer | Where-Object {$_.Default -eq $true} | Select-Object Name | ConvertTo-Json"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting default printer:', error);
        resolve(null);
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result.Name || null);
      } catch (parseError) {
        console.error('Error parsing default printer:', parseError);
        resolve(null);
      }
    });
  });
});

// Print to specific printer
ipcMain.handle('print-to-printer', async (event, printerName, htmlContent) => {
  return new Promise((resolve, reject) => {
    // Create temporary HTML file
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `receipt-${Date.now()}.html`);
    
    try {
      fs.writeFileSync(tempFile, htmlContent);
      
      // Print using PowerShell with Internet Explorer print engine
      const command = `powershell -Command "Start-Process -FilePath 'C:\\Program Files\\Internet Explorer\\iexplore.exe' -ArgumentList '-k ${tempFile}' -WindowStyle Hidden; Start-Sleep -Seconds 3; & 'rundll32' 'mshtml.dll,PrintHTML' '${tempFile}' '${printerName}'"`;
      
      exec(command, (error, stdout, stderr) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError);
        }

        if (error) {
          console.error('Error printing:', error);
          reject(new Error(`Print failed: ${error.message}`));
          return;
        }

        resolve({ success: true, message: 'Print job sent successfully' });
      });
    } catch (fileError) {
      reject(new Error(`Could not create temp file: ${fileError.message}`));
    }
  });
});

// Test printer
ipcMain.handle('test-printer', async (event, printerName) => {
  const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Printer Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-page { text-align: center; }
      </style>
    </head>
    <body>
      <div class="test-page">
        <h2>QR Scan Printer Test</h2>
        <p>Printer: ${printerName}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>If you can see this page, the printer is working correctly.</p>
      </div>
    </body>
    </html>
  `;
  
  return ipcMain.invoke('print-to-printer', event, printerName, testHTML);
});

// Get USB/Serial ports
ipcMain.handle('get-usb-ports', async () => {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      resolve(['USB001', 'USB002', 'COM1', 'COM2']);
      return;
    }

    // Get COM ports
    const command = `powershell -Command "Get-WmiObject Win32_SerialPort | Select-Object DeviceID | ConvertTo-Json"`;
    
    exec(command, (error, stdout, stderr) => {
      const defaultPorts = [
        'USB001', 'USB002', 'USB003', 'USB004',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6',
        'LPT1', 'LPT2', 'LPT3',
        'TCP/IP', 'FILE:', 'NUL:'
      ];

      if (error) {
        console.error('Error getting USB ports:', error);
        resolve(defaultPorts);
        return;
      }

      try {
        const result = JSON.parse(stdout);
        const ports = Array.isArray(result) ? result : (result ? [result] : []);
        const comPorts = ports.map(port => port.DeviceID).filter(Boolean);
        
        // Combine detected COM ports with default ports
        const allPorts = [...new Set([...defaultPorts, ...comPorts])].sort();
        resolve(allPorts);
      } catch (parseError) {
        console.error('Error parsing USB ports:', parseError);
        resolve(defaultPorts);
      }
    });
  });
});

// Folder selection dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  return {
    canceled: result.canceled,
    filePath: result.canceled ? null : result.filePaths[0]
  };
});

// Save file to directory
ipcMain.handle('save-file', async (event, directory, filename, content) => {
  try {
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Helper function to convert PowerShell printer status to readable format
function getPrinterStatusFromPS(status) {
  switch (status) {
    case 0: return 'ready';
    case 1: return 'busy';
    case 2: return 'offline';
    case 3: return 'error';
    case 4: return 'paused';
    case 5: return 'out-of-paper';
    case 6: return 'waiting';
    default: return 'unknown';
  }
}