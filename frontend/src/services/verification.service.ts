import { api, unwrap, type ApiEnvelope } from "./api";
import type { VerificationRunResult } from "../types";

export async function startVerification(
  candidateId: string
): Promise<VerificationRunResult> {
  const { data } = await api.post<ApiEnvelope<VerificationRunResult>>(
    `/verifications/${candidateId}/start`
  );
  return unwrap(data);
}
