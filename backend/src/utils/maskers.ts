/**
 * PII masking helpers.
 *
 * We never want to ship a full Aadhaar number back to a client or write
 * it to a log file. The mask retains the last four digits because that's
 * what verification ops actually use to disambiguate candidates — anything
 * less is useless, anything more is leaky.
 */

export function maskAadhaar(aadhaar: string | null | undefined): string {
  if (!aadhaar) return "";
  const digits = aadhaar.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX-XXXX-XXXX";
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * PAN numbers are less sensitive than Aadhaar (they're printed on every
 * salary slip), but we still avoid splashing them around in logs.
 */
export function maskPan(pan: string | null | undefined): string {
  if (!pan) return "";
  if (pan.length < 4) return "XXXXXXXXXX";
  return `${pan.slice(0, 2)}XXXXX${pan.slice(-3)}`;
}

/**
 * Safe console logger — strips any aadhaarNumber / panNumber fields from
 * an object before logging. Use this instead of console.log when you're
 * about to log a request/response payload.
 */
export function safeLog(label: string, payload: unknown): void {
  try {
    const cloned = JSON.parse(JSON.stringify(payload));
    redact(cloned);
    // eslint-disable-next-line no-console
    console.log(`[${label}]`, cloned);
  } catch {
    // eslint-disable-next-line no-console
    console.log(`[${label}] <unserializable payload>`);
  }
}

function redact(node: unknown): void {
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key === "aadhaarNumber" && typeof obj[key] === "string") {
      obj[key] = maskAadhaar(obj[key] as string);
    } else if (key === "panNumber" && typeof obj[key] === "string") {
      obj[key] = maskPan(obj[key] as string);
    } else if (typeof obj[key] === "object") {
      redact(obj[key]);
    }
  }
}
