// Shared API types. Mirrors what the backend returns. We keep the
// definitions tight — `unknown` for free-form payloads, narrow strings
// for status fields.

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED"
  | "PARTIAL";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  /** Always masked. Backend never sends the raw value. */
  aadhaarNumber: string;
  panNumber: string;
  dob: string;
  address: string;
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationLog {
  id: string;
  verificationType: "AADHAAR" | "PAN";
  verificationStatus: "verified" | "failed";
  requestPayload: unknown;
  responsePayload: unknown;
  verifiedAt: string;
}

export interface CandidateDetail {
  candidate: Candidate;
  verificationLogs: VerificationLog[];
}

export interface VerificationRunResult {
  overallStatus: VerificationStatus;
  aadhaarResult: {
    status: "verified" | "failed";
    nameMatch?: boolean;
    dobMatch?: boolean;
    message: string;
  };
  panResult: {
    status: "verified" | "failed";
    panStatus?: "active" | "inactive";
    message: string;
  };
}

export interface DashboardStats {
  total: number;
  verified: number;
  pending: number;
  failed: number;
  partial: number;
}
