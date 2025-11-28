# Printer Detection and Verification

This document explains how to use the printer detection and verification system in your ticket scanning application.

## Overview

The printer detection service automatically checks if a printer is connected to your device before attempting to print. If no printer is detected, printing is automatically disabled to prevent errors.

## Features

- **Automatic Detection**: Checks for printers using multiple methods
- **Smart Fallback**: Tries local print agent, system printers, and USB devices
- **Auto Enable/Disable**: Automatically enables or disables printing based on detection
- **Real-time Status**: Get instant feedback on printer connectivity

## Detection Methods

The system checks for printers in this order:

1. **Local Print Agent** (for thermal printers via http://127.0.0.1:17620)
2. **System Printers** (Electron or browser print API)
3. **USB Devices** (using Web USB API, requires user permission)

## Basic Usage

### 1. Check Printer Connection

```typescript
import { printerService } from './services/printerService';

// Verify printer connection
const result = await printerService.verifyPrinterConnection();

if (result.isPrinterConnected) {
  console.log(`Found ${result.printerCount} printer(s)`);
  console.log(`Detection method: ${result.detectionMethod}`);
} else {
  console.log(`No printer detected: ${result.message}`);
}
```

### 2. Automatic Verification Before Printing

The print functions now automatically verify printer connection:

```typescript
import { printerService } from './services/printerService';

try {
  // This will automatically check for printer before printing
  await printerService.testPrint();
  console.log('Print successful!');
} catch (error) {
  // Error will indicate if no printer is connected
  console.error('Print failed:', error.message);
}
```

### 3. Using the Printer Guard Utility

For custom print operations:

```typescript
import { printWithVerification, checkPrinterReady } from './utils/printerGuard';

// Option 1: Check if printer is ready
const isReady = await checkPrinterReady({
  showAlert: true,  // Show alert if no printer
  throwError: false  // Don't throw error, just return false
});

if (isReady) {
  // Proceed with printing
}

// Option 2: Wrap print function with automatic verification
await printWithVerification(async () => {
  // Your print code here
  await myCustomPrintFunction();
}, {
  showAlert: true,   // Show alert on error
  throwError: false  // Don't throw, return null on failure
});
```

### 4. Using the Printer Status Component

Display printer status in your UI:

```typescript
import { PrinterStatus } from './components/PrinterStatus';

function MySettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PrinterStatus />
    </div>
  );
}
```

## API Reference

### `printerService.verifyPrinterConnection()`

Returns a `PrinterDetectionResult` object:

```typescript
{
  isPrinterConnected: boolean;     // Is any printer connected?
  printerCount: number;             // Number of printers found
  detectedPrinters: Array<{        // List of detected printers
    name: string;
    type: string;
    status: string;
  }>;
  printingEnabled: boolean;         // Is printing currently enabled?
  detectionMethod: 'system' | 'local-agent' | 'none';  // How printer was detected
  message: string;                  // Status message
}
```

### `printerService.isPrintingEnabled()`

Returns `true` if printing is currently enabled (printer detected), `false` otherwise.

### `printerService.requestUSBAccess()`

Prompts user to grant access to USB devices. Returns `true` if access granted.

```typescript
// Request USB device access
const granted = await printerService.requestUSBAccess();
if (granted) {
  console.log('USB access granted');
  // Re-check for printers
  await printerService.verifyPrinterConnection();
}
```

### `printerService.clearDetectionCache()`

Clears the cached detection result, forcing a fresh check on next verification.

## Examples

### Example 1: Scan and Print with Verification

```typescript
async function handleScan(ticketCode: string) {
  // Verify printer before attempting to print
  const printerStatus = await printerService.verifyPrinterConnection();

  if (!printerStatus.isPrinterConnected) {
    alert(`Cannot print: ${printerStatus.message}`);
    // Save scan result without printing
    await saveScanResult(ticketCode, { printed: false });
    return;
  }

  // Printer is connected, proceed with printing
  try {
    await receiptService.printQRTicket({
      eventName: 'Summer Party 2025',
      eventDate: '2025-07-15',
      ticketCode: ticketCode
    });

    await saveScanResult(ticketCode, { printed: true });
  } catch (error) {
    console.error('Print failed:', error);
    alert('Print failed. Please check your printer.');
  }
}
```

### Example 2: Settings Page with Printer Status

```typescript
import { useState, useEffect } from 'react';
import { printerService } from './services/printerService';

function PrinterSettings() {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkPrinter = async () => {
    setChecking(true);
    const result = await printerService.verifyPrinterConnection();
    setStatus(result);
    setChecking(false);
  };

  useEffect(() => {
    checkPrinter();
  }, []);

  return (
    <div>
      <h2>Printer Status</h2>
      <button onClick={checkPrinter} disabled={checking}>
        {checking ? 'Checking...' : 'Refresh Status'}
      </button>

      {status && (
        <div>
          <p>Connected: {status.isPrinterConnected ? 'Yes' : 'No'}</p>
          <p>Printers Found: {status.printerCount}</p>
          <p>Status: {status.message}</p>
          <p>Printing: {status.printingEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### No Printer Detected

1. **Check Physical Connection**: Ensure printer is plugged in and powered on
2. **Check Print Agent**: If using thermal printer, ensure local print agent is running at http://127.0.0.1:17620
3. **Check Drivers**: Ensure printer drivers are installed (for system printers)
4. **Grant USB Permission**: Click "Request USB Device Access" button if using Web USB

### Printing Disabled

If printing is disabled:
- Refresh the printer status
- Check printer connection
- Try requesting USB device access
- Restart the print agent if using thermal printer

### Detection Method Shows "none"

This means no printer was detected by any method. Check:
- Is the printer connected?
- Is the print agent running?
- Do you have printer drivers installed?
- Have you granted USB permissions?

## Advanced Configuration

### Customizing Detection Timeout

Edit `src/services/printerDetectionService.ts` to adjust detection timeout:

```typescript
// Increase timeout for slower systems
const isConnected = await localPrintService.checkConnection();
```

### Adding Custom Printer Vendor IDs

To detect additional USB printer models, edit the `printerVendorIds` array in `printerDetectionService.ts`:

```typescript
const printerVendorIds = [
  0x04b8, // Epson
  0x04f9, // Brother
  // Add your printer's vendor ID here
  0x1234, // Your custom printer
];
```

## Integration Notes

- Printer verification happens automatically before every print operation
- Detection results are cached to avoid repeated checks
- Cache is cleared on demand or when printer list is refreshed
- All print operations will fail gracefully if no printer is detected
