/**
 * Printer Guard Utility
 * Helper functions to check printer status before printing operations
 */

import { printerService } from '../services/printerService';

export interface PrinterGuardOptions {
  showAlert?: boolean;
  throwError?: boolean;
}

/**
 * Check if printer is connected and printing is enabled
 * Returns true if printer is ready, false otherwise
 */
export async function checkPrinterReady(
  options: PrinterGuardOptions = { showAlert: true, throwError: false }
): Promise<boolean> {
  try {
    const result = await printerService.verifyPrinterConnection();

    if (!result.isPrinterConnected) {
      const message = `No printer detected. ${result.message}`;

      if (options.showAlert) {
        alert(message);
      }

      if (options.throwError) {
        throw new Error(message);
      }

      return false;
    }

    if (!result.printingEnabled) {
      const message = 'Printing is currently disabled. Please check printer connection.';

      if (options.showAlert) {
        alert(message);
      }

      if (options.throwError) {
        throw new Error(message);
      }

      return false;
    }

    return true;
  } catch (error) {
    const message = `Printer check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

    if (options.showAlert) {
      alert(message);
    }

    if (options.throwError) {
      throw error;
    }

    return false;
  }
}

/**
 * Execute a print operation with automatic printer verification
 * Will check printer before running the print function
 */
export async function printWithVerification<T>(
  printFunction: () => Promise<T>,
  options: PrinterGuardOptions = { showAlert: true, throwError: true }
): Promise<T | null> {
  const isReady = await checkPrinterReady(options);

  if (!isReady) {
    return null;
  }

  try {
    return await printFunction();
  } catch (error) {
    const message = `Print operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

    if (options.showAlert) {
      alert(message);
    }

    if (options.throwError) {
      throw error;
    }

    return null;
  }
}

/**
 * Get printer status summary
 */
export async function getPrinterStatus(): Promise<{
  connected: boolean;
  enabled: boolean;
  count: number;
  method: string;
  message: string;
}> {
  const result = await printerService.verifyPrinterConnection();

  return {
    connected: result.isPrinterConnected,
    enabled: result.printingEnabled,
    count: result.printerCount,
    method: result.detectionMethod,
    message: result.message,
  };
}
