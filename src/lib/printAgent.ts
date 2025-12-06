/**
 * Local Electron Print Agent client (ESC/POS)
 * Base: http://127.0.0.1:17620
 * Token: fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27
 */
export type PrintOptions = { cut?: boolean; drawer?: boolean };

const BASE_URL = "http://127.0.0.1:17620";
const TOKEN = "fbbe3ad2e74c28d01b20db42c00969e59e1f5ccc58114f27";

export async function isPrintAgentAvailable(timeoutMs = 1200): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(`${BASE_URL}/health`, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const j = await res.json().catch(() => ({}));
    return !!j?.ok;
  } catch {
    return false;
  }
}

export async function printReceipt(lines: string[], opts: PrintOptions = {}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("printReceipt: lines must be a non-empty array");
  }
  const payload = { lines, cut: opts.cut ?? true, drawer: opts.drawer ?? false };

  const res = await fetch(`${BASE_URL}/print/escpos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Print-Token": TOKEN,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "<no details>");
    throw new Error(`Print failed ${res.status}: ${msg}`);
  }
}

export async function tryPrint(
  lines: string[],
  opts?: PrintOptions
): Promise<{ ok: true } | { ok: false; error: string }> {
  const up = await isPrintAgentAvailable();
  if (!up) return { ok: false, error: "Local print agent is not running on this PC (http://127.0.0.1:17620)." };
  try { await printReceipt(lines, opts); return { ok: true }; }
  catch (e: any) { return { ok: false, error: String(e?.message || e) }; }
}