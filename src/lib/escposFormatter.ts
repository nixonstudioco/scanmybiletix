/**
 * ESC/POS 80mm formatter (42 chars)
 * Basic commands (prefix on lines). Agent forwards bytes as-is to printer.
 *
 * ESC/POS quick ref:
 *  ESC ! n   (font style)
 *  ESC a n   (align 0=left,1=center,2=right)
 */
export const WIDTH = 42;
const ESC = "\x1B";

export const A_LEFT   = `${ESC}a\x00`;
export const A_CENTER = `${ESC}a\x01`;
export const A_RIGHT  = `${ESC}a\x02`;

export const F_NORMAL       = `${ESC}!\x00`;
export const F_BOLD         = `${ESC}!\x08`;
export const F_DBL_HEIGHT   = `${ESC}!\x10`;
export const F_DBL_WIDTH    = `${ESC}!\x20`;
export const F_LARGE        = `${ESC}!\x30`;
export const F_LARGE_BOLD   = `${ESC}!\x38`;

export const line = (c = "-") => c.repeat(WIDTH);
export const dline = (c = "=") => c.repeat(WIDTH);

export const centerText = (t: string) => {
  const pad = Math.max(0, Math.floor((WIDTH - t.length) / 2));
  return " ".repeat(pad) + t;
};

export const twoCols = (left: string, right: string) => {
  const L = Math.max(0, WIDTH - right.length - 1);
  return (left.length > L ? left.slice(0, L) : left.padEnd(L, " ")) + " " + right;
};

export const wrapText = (t: string): string[] => t.match(new RegExp(`.{1,${WIDTH}}`, "g")) || [t];

export const fmtPrice = (v: number, currency = "RON") => `${v.toFixed(2)} ${currency}`;
export const fmtDateTime = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
};
