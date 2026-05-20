// Match the regex rules used by the backend so we never let through a
// payload that would just be rejected server-side.
export const AADHAAR_REGEX = /^\d{12}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PHONE_REGEX = /^\d{10}$/;

export const STATUS_OPTIONS = [
  "ALL",
  "VERIFIED",
  "PENDING",
  "PARTIAL",
  "FAILED",
] as const;

export type StatusFilter = (typeof STATUS_OPTIONS)[number];
