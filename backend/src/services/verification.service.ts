import axios, { AxiosError } from "axios";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { Forbidden, NotFound } from "../utils/httpError";
import { invalidateStats } from "./candidate.service";
import {
  LogResult,
  VerificationStatus,
  VerificationType,
  VerificationStatusValue,
} from "../utils/constants";
import {
  AadhaarVerifyResponse,
  PanVerifyResponse,
} from "../types";

export interface VerificationRunResult {
  overallStatus: VerificationStatusValue;
  aadhaarResult: AadhaarVerifyResponse;
  panResult: PanVerifyResponse;
}

/**
 * Runs both Aadhaar and PAN verification for a candidate and persists
 * the results to the verification log.
 *
 * We talk to the mock APIs over HTTP (axios) instead of calling the
 * controllers directly. This costs a tiny bit of latency but means the
 * code path is identical to what we'd run against a real third-party —
 * swap the URL in .env and we're done.
 */
export async function runVerification(
  userId: string,
  candidateId: string
): Promise<VerificationRunResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) throw NotFound("Candidate not found");
  if (candidate.createdById !== userId) throw Forbidden();

  // Run both verifications in parallel — they're independent.
  const [aadhaarResult, panResult] = await Promise.all([
    callAadhaarApi(candidate.aadhaarNumber),
    callPanApi(candidate.panNumber),
  ]);

  // Persist both log rows in a single transaction so the candidate's
  // status update is consistent with what we wrote to the log.
  const overallStatus = computeOverall(
    aadhaarResult.status,
    panResult.status
  );

  await prisma.$transaction([
    prisma.verificationLog.create({
      data: {
        candidateId,
        verificationType: VerificationType.AADHAAR,
        // We log the *masked* request payload here too. Even our own DB
        // shouldn't carry raw Aadhaar numbers in the log table — the
        // candidates table is the single source of truth.
        requestPayload: { aadhaarNumber: maskFor(candidate.aadhaarNumber) },
        responsePayload: aadhaarResult as unknown as object,
        verificationStatus: aadhaarResult.status,
      },
    }),
    prisma.verificationLog.create({
      data: {
        candidateId,
        verificationType: VerificationType.PAN,
        requestPayload: { panNumber: candidate.panNumber },
        responsePayload: panResult as unknown as object,
        verificationStatus: panResult.status,
      },
    }),
    prisma.candidate.update({
      where: { id: candidateId },
      data: { status: overallStatus },
    }),
  ]);

  // The candidate's status just changed — the dashboard's cached
  // counts are now stale.
  await invalidateStats(userId);

  return { overallStatus, aadhaarResult, panResult };
}

function computeOverall(
  aadhaar: "verified" | "failed",
  pan: "verified" | "failed"
): VerificationStatusValue {
  const aOk = aadhaar === LogResult.VERIFIED;
  const pOk = pan === LogResult.VERIFIED;
  if (aOk && pOk) return VerificationStatus.VERIFIED;
  if (!aOk && !pOk) return VerificationStatus.FAILED;
  return VerificationStatus.PARTIAL;
}

async function callAadhaarApi(
  aadhaarNumber: string
): Promise<AadhaarVerifyResponse> {
  try {
    const { data } = await axios.post<AadhaarVerifyResponse>(
      env.aadhaarApiUrl,
      { aadhaarNumber },
      { timeout: 10_000 }
    );
    return data;
  } catch (err) {
    // Network / upstream failures shouldn't tank the request. Surface
    // them as a failed verification so the user can retry later.
    return upstreamFailure<AadhaarVerifyResponse>(err, "Aadhaar verification");
  }
}

async function callPanApi(panNumber: string): Promise<PanVerifyResponse> {
  try {
    const { data } = await axios.post<PanVerifyResponse>(
      env.panApiUrl,
      { panNumber },
      { timeout: 10_000 }
    );
    return data;
  } catch (err) {
    return upstreamFailure<PanVerifyResponse>(err, "PAN verification");
  }
}

function upstreamFailure<T extends { status: "verified" | "failed"; message: string }>(
  err: unknown,
  label: string
): T {
  const axiosErr = err as AxiosError;
  const message =
    axiosErr?.code === "ECONNABORTED"
      ? `${label} timed out`
      : `${label} upstream is unreachable`;
  return { status: "failed", message } as T;
}

// Local copy of maskAadhaar to avoid an import cycle.
function maskFor(aadhaar: string): string {
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}
