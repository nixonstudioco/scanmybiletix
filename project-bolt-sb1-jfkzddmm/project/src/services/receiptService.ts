import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { localPrintService } from './localPrintService';

export interface ReceiptData {
  eventName: string;
  eventDate: string;
  paymentMethod: 'CASH' | 'CARD';
  ticketCode: string;
  entryType?: string; // Add entry type for scan receipts
  quantity: number;
  totalAmount: number;
  ean13Barcode: string;
  logoUrl?: string;
}

export interface MultiTicketReceiptData {
  eventName: string;
  eventDate: string;
  paymentMethod: 'CASH' | 'CARD';
  ticketCodes: string[];
  quantity: number;
  totalAmount: number;
  ean13Barcode: string;
  logoUrl?: string;
}

export interface QRTicketData {
  eventName: string;
  eventDate: string;
  ticketCode: string;
  logoUrl?: string;
}
class ReceiptService {
  /**
   * Check if local print server is available
   */
  async isLocalPrintAvailable(): Promise<boolean> {
    try {
      return await localPrintService.checkConnection();
    } catch (error) {
      return false;
    }
  }

  // Generate a unique ticket code
  generateTicketCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}${random}`.toUpperCase();
  }

  // Generate QR code as data URL
  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: 150,
        height: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate EAN13 barcode as data URL
  generateEAN13Barcode(code: string): string {
    try {
      // Validate EAN13 format
      if (!/^\d{13}$/.test(code)) {
        throw new Error('EAN13 code must be exactly 13 digits');
      }

      const canvas = document.createElement('canvas');
      
      JsBarcode(canvas, code, {
        format: 'EAN13',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 10,
        textMargin: 2,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000'
      });
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating EAN13 barcode:', error);
      throw new Error('Failed to generate EAN13 barcode');
    }
  }

  // Create receipt HTML for 80mm thermal printer
  async createReceiptHTML(receiptData: ReceiptData, includeQRCode: boolean = true): Promise<string> {
    const qrCodeDataUrl = includeQRCode ? await this.generateQRCode(receiptData.ticketCode) : null;
    const ean13DataUrl = this.generateEAN13Barcode(receiptData.ean13Barcode);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${receiptData.ticketCode}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            width: 210mm;
            height: 297mm;
            font-size: 16px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            min-height: 297mm;
            height: 297mm;
          }
          
          .receipt {
            width: 100%;
            max-width: 170mm;
            margin: 0 auto;
            text-align: center;
            display: block;
            padding: 0;
          }
          
          .header {
            border-bottom: 2px dashed #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .logo {
            max-width: 80mm;
            max-height: 40mm;
            margin-bottom: 15px;
            display: block;
          }
          
          .event-name {
            font-size: 28px;
            font-weight: 900;
            margin: 15px 0;
            color: #000000;
          }
          
          .event-date {
            font-size: 18px;
            margin: 10px 0;
            font-weight: 700;
            color: #000000;
          }
          
          .ticket-type-section {
            background: #e8e8e8;
            border: 2px solid #000;
            padding: 30px;
            margin: 40px 0;
            text-align: center;
          }
          
          .ticket-type {
            font-size: 36px;
            font-weight: 900;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #000000;
          }
          
          .scan-time {
            font-size: 16px;
            font-weight: 700;
            margin: 15px 0;
            color: #000000;
          }
          
          .qr-section {
            margin: 30px 0;
          }
          
          .qr-code {
            width: 80mm;
            height: 80mm;
            margin: 0 auto;
            display: block;
          }
          
          .qr-label {
            font-size: 14px;
            margin-top: 15px;
          }
          
          .footer {
            border-top: 2px dashed #000;
            padding-top: 20px;
            margin-top: 40px;
            margin-bottom: 0;
            font-size: 14px;
            font-weight: 600;
            color: #000000;
          }
          
          .footer-line {
            margin: 8px 0;
            font-weight: 600;
          }
          
          .footer-line:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
          }
          
          .ticket-code {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            background: #e0e0e0;
            padding: 8px 15px;
            margin: 15px 0;
            border-radius: 5px;
            font-weight: 700;
            color: #000000;
          }
          
          .scan-info {
            margin: 30px 0;
            padding: 20px;
            border: 2px solid #000;
            border-radius: 10px;
          }
          
          .scan-info .title {
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 10px;
            color: #000000;
          }
          
          .scan-info .subtitle {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #000000;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              height: 297mm !important;
              min-height: 297mm !important;
            }
            
            @page {
              margin: 0 !important;
              padding: 0 !important;
              size: A4 !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .receipt {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            .footer {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          
          @media screen {
            body {
              background: #f0f0f0;
              padding: 40px;
            }
            
            .receipt {
              background: white;
              padding: 30px;
              border: 1px solid #ccc;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 170mm;
              margin: 0 auto;
              border-radius: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="event-name">${receiptData.eventName}</div>
            <div class="event-date">${receiptData.eventDate}</div>
          </div>
          
          <div class="ticket-type-section">
            <div style="font-size: 18px; margin-bottom: 15px; font-weight: 900; color: #000000;">TIP BILET</div>
            <div class="ticket-type">${receiptData.entryType || 'STANDARD ENTRY'}</div>
            <div class="scan-time">Scanat: ${new Date().toLocaleString('ro-RO')}</div>
          </div>
          
          <div class="scan-info">
            <div class="title">INTRARE VERIFICATA</div>
            <div class="subtitle">Acces permis</div>
            <div class="ticket-code">Bilet: ${receiptData.ticketCode}</div>
          </div>
          
          <div class="footer">
            <div class="footer-line">Bon de verificare intrare</div>
            <div class="footer-line">Valabil doar pentru data evenimentului</div>
            <div class="footer-line" style="font-size: 12px; margin-top: 15px; font-weight: 600;">
              Generat: ${new Date().toLocaleString('ro-RO')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Create multi-ticket receipt HTML for 80mm thermal printer
  async createMultiTicketReceiptHTML(receiptData: MultiTicketReceiptData): Promise<string> {
    const ean13DataUrl = this.generateEAN13Barcode(receiptData.ean13Barcode);
    
    // Generate QR codes for all tickets
    const qrCodes = await Promise.all(
      receiptData.ticketCodes.map(code => this.generateQRCode(code))
    );
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${receiptData.quantity} Tickets</title>
        <style>
          @page {
            size: 72mm auto;
            margin: 0;
            padding: 0;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 8px;
            width: 72mm;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            min-height: auto;
            height: auto;
          }
          
          .receipt {
            width: 100%;
            text-align: center;
            display: block;
            margin: 0;
            padding: 0;
          }
          
          .header {
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          
          .logo {
            max-width: 50mm;
            max-height: 20mm;
            margin-bottom: 4px;
            display: block;
          }
          
          .event-name {
            font-size: 16px;
            font-weight: bold;
            margin: 4px 0;
          }
          
          .event-date {
            font-size: 10px;
            margin: 2px 0;
          }
          
          .receipt-info {
            margin: 8px 0;
            text-align: left;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 11px;
          }
          
          .info-label {
            font-weight: bold;
          }
          
          .payment-section {
            background: #f0f0f0;
            border: 1px solid #000;
            padding: 6px;
            margin: 8px 0;
          }
          
          .total-amount {
            font-size: 14px;
            font-weight: bold;
            margin: 4px 0;
          }
          
          .tickets-section {
            margin: 10px 0;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          
          .tickets-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .ticket-item {
            border: 1px solid #000;
            margin: 8px 0;
            padding: 6px;
            background: #fff;
          }
          
          .ticket-number {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 4px;
            text-align: center;
          }
          
          .qr-section {
            margin: 6px 0;
          }
          
          .qr-code {
            width: 30mm;
            height: 30mm;
            margin: 0 auto;
            display: block;
          }
          
          .qr-label {
            font-size: 8px;
            margin-top: 2px;
          }
          
          .ticket-code {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            background: #f0f0f0;
            padding: 2px 4px;
            margin: 2px 0;
            text-align: center;
          }
          
          .barcode-section {
            margin: 10px 0;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          
          .barcode {
            width: 60mm;
            height: auto;
            margin: 0 auto;
            display: block;
          }
          
          .barcode-label {
            font-size: 9px;
            margin-top: 2px;
          }
          
          .footer {
            border-top: 2px dashed #000;
            padding-top: 8px;
            margin-top: 8px;
            margin-bottom: 0;
            font-size: 10px;
          }
          
          .footer-line {
            margin: 2px 0;
          }
          
          .footer-line:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              height: auto !important;
              min-height: auto !important;
            }
            
            @page {
              margin: 0 !important;
              padding: 0 !important;
              size: 72mm auto !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .receipt {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            .ticket-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .footer {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          
          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
            }
            
            .receipt {
              background: white;
              padding: 8px;
              border: 1px solid #ccc;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              width: 72mm;
              margin: 0 auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${receiptData.logoUrl ? `<img src="${receiptData.logoUrl}" alt="Logo" class="logo">` : ''}
            <div class="event-name">${receiptData.eventName}</div>
            <div class="event-date">${receiptData.eventDate}</div>
          </div>
          
          <div class="receipt-info">
            <div class="info-row">
              <span class="info-label">Bilete:</span>
              <span>${receiptData.quantity}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Plată:</span>
              <span>${receiptData.paymentMethod === 'CASH' ? 'NUMERAR' : 'CARD'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Timp:</span>
              <span>${new Date().toLocaleString('ro-RO')}</span>
            </div>
          </div>
          
          <div class="payment-section">
            <div class="total-amount">TOTAL: ${receiptData.totalAmount} RON</div>
            <div style="font-size: 10px;">Prezentați la casă pentru plată</div>
          </div>
          
          <div class="tickets-section">
            <div class="tickets-title">BILETELE DUMNEAVOASTRĂ</div>
            ${receiptData.ticketCodes.map((code, index) => `
              <div class="ticket-item">
                <div class="ticket-number">BILET ${index + 1} din ${receiptData.quantity}</div>
                <div class="qr-section">
                  <img src="${qrCodes[index]}" alt="QR Code ${index + 1}" class="qr-code">
                  <div class="qr-label">Scanați pentru verificare</div>
                  <div class="ticket-code">Cod: ${code}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="barcode-section">
            <img src="${ean13DataUrl}" alt="EAN13 Barcode" class="barcode">
            <div class="barcode-label">Pentru sistem de casă</div>
          </div>
          
          <div class="footer">
            <div class="footer-line">Bilete electronice generate</div>
            <div class="footer-line">Valabile doar pentru data specificată</div>
            <div class="footer-line">Nu se restituie banii</div>
            <div class="footer-line" style="font-size: 8px; margin-top: 4px;">
              Generat: ${new Date().toLocaleString('ro-RO')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Print multi-ticket receipt using window.print()
  async printMultiTicketReceipt(receiptData: MultiTicketReceiptData): Promise<boolean> {
    try {
      const receiptHTML = await this.createMultiTicketReceiptHTML(receiptData);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=400,height=800');
      
      if (!printWindow) {
        console.warn('Print window blocked by popup blocker, trying alternative method...');
        
        // Try alternative approach: create a blob and open it
        try {
          const blob = new Blob([receiptHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          
          if (!newWindow) {
            // Last resort: print in current window
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = receiptHTML;
            window.print();
            document.body.innerHTML = originalContent;
            return true;
          }
          
          // Clean up blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(url), 30000);
          
          return new Promise((resolve) => {
            const checkClosed = () => {
              if (newWindow.closed) {
                resolve(true);
              } else {
                setTimeout(checkClosed, 1000);
              }
            };
            checkClosed();
          });
        } catch (blobError) {
          throw new Error('Could not print receipt. Please allow popups for this site or use QZ Tray for direct printing.');
        }
      }
      
      // Write the HTML to the print window
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set up print event listeners
      return new Promise((resolve) => {
        const handleAfterPrint = () => {
          printWindow.removeEventListener('afterprint', handleAfterPrint);
          printWindow.close();
          resolve(true);
        };
        
        printWindow.addEventListener('afterprint', handleAfterPrint);
        
        // Focus the print window and trigger print
        printWindow.focus();
        printWindow.print();
        
        // Fallback timeout to close window
        setTimeout(() => {
          printWindow.removeEventListener('afterprint', handleAfterPrint);
          if (!printWindow.closed) {
            printWindow.close();
          }
          resolve(true);
        }, 15000);
      });
      
    } catch (error) {
      console.error('Error printing multi-ticket receipt:', error);
      throw error;
    }
  }

  // Print receipt using window.print()
  async printReceipt(receiptData: ReceiptData, showQRCode: boolean = true): Promise<boolean> {
    try {
      // Try local print server first for direct printing
      const isLocalPrintAvailable = await this.isLocalPrintAvailable();
      if (isLocalPrintAvailable) {
        console.log('Using local print server for direct thermal printing...');
        
        try {
          await localPrintService.printThermalReceipt({
            eventName: receiptData.eventName,
            eventDate: receiptData.eventDate,
            ticketType: receiptData.entryType || 'STANDARD ENTRY',
            ticketCode: receiptData.ticketCode,
            scanTime: new Date().toLocaleString('ro-RO')
          });
          console.log('Receipt printed successfully via local print server');
          return true;
        } catch (printError) {
          console.error('Local print server failed:', printError);
          throw new Error(`Direct printing failed: ${(printError as Error).message}`);
        }
      }
      
      const receiptHTML = await this.createReceiptHTML(receiptData, showQRCode);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups for this site.');
      }
      
      // Write the HTML to the print window
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set up print event listeners
      return new Promise((resolve) => {
        const handleAfterPrint = () => {
          printWindow.removeEventListener('afterprint', handleAfterPrint);
          printWindow.close();
          resolve(true);
        };
        
        printWindow.addEventListener('afterprint', handleAfterPrint);
        
        // Focus the print window and trigger print
        printWindow.focus();
        printWindow.print();
        
        // Fallback timeout to close window
        setTimeout(() => {
          printWindow.removeEventListener('afterprint', handleAfterPrint);
          if (!printWindow.closed) {
            printWindow.close();
          }
          resolve(true);
        }, 10000);
      });
      
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }

  // Print QR-only ticket using window.print()
  async printQRTicket(ticketData: QRTicketData): Promise<boolean> {
    try {
      // Try local print server first for QR ticket printing
      const isLocalPrintAvailable = await this.isLocalPrintAvailable();
      if (isLocalPrintAvailable) {
        console.log('Using local print server for QR ticket printing...');
        
        try {
          await localPrintService.printThermalReceipt({
            eventName: ticketData.eventName,
            eventDate: ticketData.eventDate,
            ticketType: 'VERIFIED ENTRY',
            ticketCode: ticketData.ticketCode,
            scanTime: new Date().toLocaleString('ro-RO')
          });
          console.log('QR ticket printed successfully via local print server');
          return true;
        } catch (printError) {
          console.error('Local print server QR ticket printing failed:', printError);
          throw new Error(`Direct QR ticket printing failed: ${(printError as Error).message}`);
        }
      }
      
      // Create a simple scan verification receipt
      const receiptData = {
        eventName: ticketData.eventName,
        eventDate: ticketData.eventDate,
        paymentMethod: 'CASH' as const,
        ticketCode: ticketData.ticketCode,
        entryType: 'VERIFIED ENTRY',
        quantity: 1,
        totalAmount: 0,
        ean13Barcode: '1234567890128',
        logoUrl: ticketData.logoUrl
      };
      
      const ticketHTML = await this.createReceiptHTML(receiptData, true);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (!printWindow) {
        console.warn('Print window blocked by popup blocker, trying alternative method...');
        
        // Try alternative approach: create a blob and open it
        try {
          const blob = new Blob([ticketHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          
          if (!newWindow) {
            // Last resort: print in current window
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = ticketHTML;
            window.print();
            document.body.innerHTML = originalContent;
            return true;
          }
          
          // Clean up blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(url), 30000);
          
          return new Promise((resolve) => {
            const checkClosed = () => {
              if (newWindow.closed) {
                resolve(true);
              } else {
                setTimeout(checkClosed, 1000);
              }
            };
            checkClosed();
          });
        } catch (blobError) {
          throw new Error('Could not print receipt. Please allow popups for this site or use QZ Tray for direct printing.');
        }
      }
      
      // Write the HTML to the print window
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set up print event listeners
      return new Promise((resolve) => {
        const handleAfterPrint = () => {
          printWindow.removeEventListener('afterprint', handleAfterPrint);
          printWindow.close();
          resolve(true);
        };
        
        printWindow.addEventListener('afterprint', handleAfterPrint);
        
        // Focus the print window and trigger print
        printWindow.focus();
        printWindow.print();
        
        // Fallback timeout to close window
        setTimeout(() => {
          printWindow.removeEventListener('afterprint', handleAfterPrint);
          if (!printWindow.closed) {
            printWindow.close();
          }
          resolve(true);
        }, 10000);
      });
      
    } catch (error) {
      console.error('Error printing QR ticket:', error);
      throw error;
    }
  }

  // Create a preview of the receipt (for testing/debugging)
  async createReceiptPreview(receiptData: ReceiptData): Promise<string> {
    return await this.createReceiptHTML(receiptData);
  }
  
  /**
   * Get local print service instance
   */
  getLocalPrintService() {
    return localPrintService;
  }
}

export const receiptService = new ReceiptService();