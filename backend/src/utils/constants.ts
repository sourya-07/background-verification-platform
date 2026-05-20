/**
 * Centralized constants so we don't sprinkle magic strings throughout the
 * codebase. If we ever rename a status value, this is the one place to
 * change it.
 */

export const VerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
  PARTIAL: "PARTIAL",
} as const;

export type VerificationStatusValue =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const VerificationType = {
  AADHAAR: "AADHAAR",
  PAN: "PAN",
} as const;

export type VerificationTypeValue =
  (typeof VerificationType)[keyof typeof VerificationType];

// Result string used inside VerificationLog.verificationStatus — kept
// separate from the candidate-level status above on purpose. A single
// log row is either verified or failed; the candidate's overall status
// can also be PENDING or PARTIAL.
export const LogResult = {
  VERIFIED: "verified",
  FAILED: "failed",
} as const;

// Regex sources of truth — used by both Zod validators and the mock APIs
// so the rules can never drift.
export const AADHAAR_REGEX = /^\d{12}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PHONE_REGEX = /^\d{10}$/;
