export interface Ticket {
  qrCode: string;
  entryName: string;
  entriesRemaining: number;
  lastScanned: string | null;
  club: string;
}

export interface ScanHistory {
  id?: number;
  qrCode: string;
  timestamp: string;
  success: boolean;
  message: string;
}

export interface ScanResult {
  qrCode: string;
  timestamp: string;
  success: boolean;
  message: string;
  ticket?: Ticket;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AppSettings {
  id: string;
  logoUrl: string | null;
  clubName: string;
  ean13Barcode: string | number;
  ticketPrice?: number;
  adminPin?: string;
  createdAt: string;
  updatedAt: string;
}