import { api, unwrap, type ApiEnvelope } from "./api";
import type {
  Candidate,
  CandidateDetail,
  DashboardStats,
} from "../types";

export interface CandidateInput {
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  panNumber: string;
  dob: string;
  address: string;
}

export interface ListParams {
  search?: string;
  status?: "VERIFIED" | "PENDING" | "FAILED" | "PARTIAL";
}

export async function listCandidates(
  params: ListParams = {}
): Promise<Candidate[]> {
  const { data } = await api.get<ApiEnvelope<Candidate[]>>("/candidates", {
    params,
  });
  return unwrap(data);
}

export async function getCandidate(id: string): Promise<CandidateDetail> {
  const { data } = await api.get<ApiEnvelope<CandidateDetail>>(
    `/candidates/${id}`
  );
  return unwrap(data);
}

export async function createCandidate(
  input: CandidateInput
): Promise<Candidate> {
  const { data } = await api.post<ApiEnvelope<Candidate>>("/candidates", input);
  return unwrap(data);
}

export async function updateCandidate(
  id: string,
  input: Partial<CandidateInput>
): Promise<Candidate> {
  const { data } = await api.put<ApiEnvelope<Candidate>>(
    `/candidates/${id}`,
    input
  );
  return unwrap(data);
}

export async function deleteCandidate(id: string): Promise<void> {
  await api.delete(`/candidates/${id}`);
}

export async function getStats(): Promise<DashboardStats> {
  const { data } = await api.get<ApiEnvelope<DashboardStats>>(
    "/candidates/stats"
  );
  return unwrap(data);
}
