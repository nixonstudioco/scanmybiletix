/**
 * Local Print Agent client (ESC/POS)
 * Base URL: http://127.0.0.1:17620
 * Endpoints:
 *  - GET  /health
 *  - POST /print/escpos   { lines: string[], cut?: boolean, drawer?: boolean }
 * Requires header: X-Print-Token
 */
export type PrintOptions = { cut?: boolean; drawer?: boolean };

type Health = { ok: boolean };

let BASE_URL = "http://127.0.0.1:17620";
let TOKEN: string | null = null;

export function setPrintAgentBase(url: string) {
  BASE_URL = url.replace(/\/+$/,"");
}
export function setPrintAgentToken(token: string) {
  TOKEN = token;
}

/** Probe availability; resolves true/false. */
export async function isPrintAgentAvailable(timeoutMs = 800): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(`${BASE_URL}/health`, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const j = (await res.json()) as Health;
    return !!j?.ok;
  } catch (error) { 
    // Log specific error types for debugging
    if (error instanceof Error) {
      console.warn('Print agent availability check failed:', error.message);
    }
    return false; 
  }
}

/** Print a receipt as lines. Throws on failure. */
export async function printReceipt(lines: string[], opts: PrintOptions = {}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("printReceipt: 'lines' must be a non-empty array");
  }
  if (!TOKEN) throw new Error("printReceipt: token not set. Call setPrintAgentToken('<token>')");

  const available = await isPrintAgentAvailable(800);
  if (!available) throw new Error("Local print agent not reachable at 127.0.0.1:17620");

  const payload = {
    lines,
    cut: opts.cut ?? true,
    drawer: opts.drawer ?? false,
  };

  try {
    const res = await fetch(`${BASE_URL}/print/escpos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Print-Token": TOKEN!,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = "<no details>";
      try { msg = await res.text(); } catch {}
      
      if (res.status === 401) {
        throw new Error(`Print failed (${res.status}): Invalid or missing token. Check your print agent token configuration.`);
      }
      
      throw new Error(`Print failed (${res.status}): ${msg}`);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("CORS Error: Local print agent needs to allow origin 'https://scan.mybiletix.com'");
    }
    throw error;
  }
}