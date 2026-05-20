// Small formatting helpers that are reused across pages.

export function formatDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ field?: string; message?: string }> | unknown;
    };
  };
  message?: string;
}

/**
 * Friendly extractor for axios errors. The backend returns
 * `{ success: false, message, errors? }`. When validation errors are
 * present we surface the first field-level message because it's more
 * actionable than the generic "Validation failed" envelope message.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err !== "object" || err === null) return fallback;
  const anyErr = err as ApiErrorShape;
  const data = anyErr.response?.data;

  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (first && typeof first.message === "string" && first.message.length > 0) {
      return first.field
        ? `${first.field}: ${first.message}`
        : first.message;
    }
  }

  return data?.message ?? anyErr.message ?? fallback;
}
