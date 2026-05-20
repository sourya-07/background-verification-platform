import { z } from "zod";
import {
  AADHAAR_REGEX,
  PAN_REGEX,
  PHONE_REGEX,
  VerificationStatus,
} from "../utils/constants";

// Zod's z.coerce.date() understands both ISO strings and Date objects,
// which is exactly what we get from JSON requests.
export const candidateCreateSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Phone must be exactly 10 digits"),
  aadhaarNumber: z
    .string()
    .trim()
    .regex(AADHAAR_REGEX, "Aadhaar must be exactly 12 digits"),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, "Invalid PAN format (e.g. ABCDE1234F)"),
  dob: z.coerce.date({ invalid_type_error: "Invalid date of birth" }),
  address: z.string().trim().min(1, "Address is required").max(500),
});

// Partial update — every field is optional, but if present must still pass
// its base rule. .partial() handles this for us.
export const candidateUpdateSchema = candidateCreateSchema.partial();

export const candidateListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z
    .enum([
      VerificationStatus.PENDING,
      VerificationStatus.VERIFIED,
      VerificationStatus.FAILED,
      VerificationStatus.PARTIAL,
    ])
    .optional(),
});

export type CandidateCreateInput = z.infer<typeof candidateCreateSchema>;
export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>;
export type CandidateListQuery = z.infer<typeof candidateListQuerySchema>;
