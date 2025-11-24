import React from "react";
import { isPrintAgentAvailable, printReceipt, setPrintAgentToken } from "../lib/printAgent";

export function PrintTestButton({ token }: { token: string }) {
  React.useEffect(() => { setPrintAgentToken(token); }, [token]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const onClick = async () => {
    setBusy(true); setMsg(null);
    try {
      const ok = await isPrintAgentAvailable();
      if (!ok) throw new Error("Agent not running on 127.0.0.1:17620");
      await printReceipt([
        "My Shop",
        "---------------------------",
        "Item A          9.99",
        "Item B          3.50",
        "---------------------------",
        "TOTAL          13.49",
        "",
        "Thank you!"
      ], { cut: true });
      setMsg("Printed ✔");
    } catch (e:any) {
      setMsg(e?.message || String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <button className="px-3 py-2 rounded-md border" onClick={onClick} disabled={busy}>
        {busy ? "Printing…" : "Print test"}
      </button>
      {msg && <div className="text-sm opacity-75">{msg}</div>}
    </div>
  );
}