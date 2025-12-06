/**
 * Generic print service:
 * - A minimal builder to compose lines (with optional ESC/POS prefixes)
 * - One call to send them via the local agent
 */
import { tryPrint, printReceipt, isPrintAgentAvailable, PrintOptions } from "./printAgent";
import { A_LEFT, A_CENTER, F_NORMAL, F_BOLD, F_LARGE_BOLD, line, dline, wrapText, twoCols, centerText } from "./escposFormatter";

export class ReceiptBuilder {
  private lines: string[] = [];

  raw(s: string = "") { this.lines.push(s); return this; }

  br() { this.lines.push(""); return this; }

  left(text: string, font = F_NORMAL) {
    this.lines.push(A_LEFT + font + text + F_NORMAL + A_LEFT);
    return this;
  }

  center(text: string, font = F_NORMAL) {
    this.lines.push(A_CENTER + font + text + F_NORMAL + A_LEFT);
    return this;
  }

  wrap(text: string, font = F_NORMAL) {
    for (const w of wrapText(text)) this.lines.push(A_LEFT + font + w + F_NORMAL + A_LEFT);
    return this;
  }

  cols(left: string, right: string, font = F_NORMAL) {
    this.lines.push(A_LEFT + font + twoCols(left, right) + F_NORMAL + A_LEFT);
    return this;
  }

  sep(char = "-")  { this.lines.push(line(char)); return this; }
  dsep(char = "=") { this.lines.push(dline(char)); return this; }

  build(): string[] { return [...this.lines]; }

  async print(opts?: PrintOptions) {
    const ok = await isPrintAgentAvailable();
    if (!ok) throw new Error("Local print agent is not available at http://127.0.0.1:17620");
    await printReceipt(this.lines, opts);
  }
}

export { tryPrint, printReceipt, isPrintAgentAvailable };
