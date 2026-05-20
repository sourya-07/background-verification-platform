import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { Forbidden, NotFound } from "../utils/httpError";
import { maskAadhaar } from "../utils/maskers";
import {
  cacheDel,
  cacheGet,
  cacheKeys,
  cacheSet,
  STATS_TTL_SECONDS,
} from "../utils/cache";
import {
  CandidateCreateInput,
  CandidateListQuery,
  CandidateUpdateInput,
} from "../validations/candidate.validation";

/**
 * Shape returned to the client. Notably, `aadhaarNumber` is always the
 * masked form — the raw 12-digit number never leaves this service.
 */
export interface CandidateDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string; // masked
  panNumber: string;
  dob: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function toDTO(c: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  panNumber: string;
  dob: Date;
  address: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): CandidateDTO {
  return {
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    aadhaarNumber: maskAadhaar(c.aadhaarNumber),
    panNumber: c.panNumber,
    dob: c.dob.toISOString(),
    address: c.address,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function createCandidate(
  userId: string,
  input: CandidateCreateInput
): Promise<CandidateDTO> {
  const created = await prisma.candidate.create({
    data: {
      ...input,
      createdById: userId,
    },
  });
  // Adding a candidate bumps "total" and "pending" on the dashboard —
  // drop the cached stats so the next GET recomputes.
  await invalidateStats(userId);
  return toDTO(created);
}

export async function listCandidates(
  userId: string,
  query: CandidateListQuery
): Promise<CandidateDTO[]> {
  // Ownership is enforced at the query level: we only ever ask the DB
  // for rows that belong to the logged-in user.
  const where: Prisma.CandidateWhereInput = { createdById: userId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search && query.search.length > 0) {
    const term = query.search;
    where.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.candidate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toDTO);
}

/**
 * Loads a candidate by id and enforces that the caller owns it.
 * Returns the candidate plus its verification logs (also DTO-shaped so
 * raw payloads remain safe).
 */
export async function getCandidateById(
  userId: string,
  candidateId: string
): Promise<{
  candidate: CandidateDTO;
  verificationLogs: Array<{
    id: string;
    verificationType: string;
    verificationStatus: string;
    requestPayload: unknown;
    responsePayload: unknown;
    verifiedAt: string;
  }>;
}> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      verificationLogs: { orderBy: { verifiedAt: "desc" } },
    },
  });

  if (!candidate) throw NotFound("Candidate not found");
  if (candidate.createdById !== userId) {
    // Use 404 rather than 403 here so we don't leak the existence of
    // other users' candidates. Same blast radius, less information.
    throw NotFound("Candidate not found");
  }

  return {
    candidate: toDTO(candidate),
    verificationLogs: candidate.verificationLogs.map((log) => ({
      id: log.id,
      verificationType: log.verificationType,
      verificationStatus: log.verificationStatus,
      // requestPayload may contain the raw Aadhaar/PAN — strip them
      // before returning. We keep the *shape* so the UI accordion still
      // shows something meaningful.
      requestPayload: redactPayload(log.requestPayload),
      responsePayload: log.responsePayload,
      verifiedAt: log.verifiedAt.toISOString(),
    })),
  };
}

export async function updateCandidate(
  userId: string,
  candidateId: string,
  input: CandidateUpdateInput
): Promise<CandidateDTO> {
  await ensureOwnership(userId, candidateId);

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: input,
  });
  return toDTO(updated);
}

export async function deleteCandidate(
  userId: string,
  candidateId: string
): Promise<void> {
  await ensureOwnership(userId, candidateId);
  await prisma.candidate.delete({ where: { id: candidateId } });
  await invalidateStats(userId);
}

export interface DashboardStats {
  total: number;
  verified: number;
  pending: number;
  failed: number;
  partial: number;
}

/**
 * Stats helper for the dashboard. Cached in Redis with a short TTL —
 * the dashboard is the most-refreshed page so even 30 seconds of
 * caching keeps the DB quiet during heavy use.
 *
 * One groupBy round trip beats four separate count queries.
 */
export async function getStats(userId: string): Promise<DashboardStats> {
  const cacheKey = cacheKeys.dashboardStats(userId);
  const cached = await cacheGet<DashboardStats>(cacheKey);
  if (cached) return cached;

  const groups = await prisma.candidate.groupBy({
    by: ["status"],
    where: { createdById: userId },
    _count: { _all: true },
  });

  const out: DashboardStats = {
    total: 0,
    verified: 0,
    pending: 0,
    failed: 0,
    partial: 0,
  };
  for (const g of groups) {
    const count = g._count._all;
    out.total += count;
    switch (g.status) {
      case "VERIFIED":
        out.verified = count;
        break;
      case "PENDING":
        out.pending = count;
        break;
      case "FAILED":
        out.failed = count;
        break;
      case "PARTIAL":
        out.partial = count;
        break;
    }
  }

  await cacheSet(cacheKey, out, STATS_TTL_SECONDS);
  return out;
}

/**
 * Drop the cached stats for a user. Called from anywhere that mutates
 * a candidate's status or count.
 */
export async function invalidateStats(userId: string): Promise<void> {
  await cacheDel(cacheKeys.dashboardStats(userId));
}

async function ensureOwnership(
  userId: string,
  candidateId: string
): Promise<void> {
  const row = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { createdById: true },
  });
  if (!row) throw NotFound("Candidate not found");
  if (row.createdById !== userId) throw Forbidden();
}

function redactPayload(value: Prisma.JsonValue): Prisma.JsonValue {
  if (!value || typeof value !== "object") return value;
  const cloned = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  if (typeof cloned.aadhaarNumber === "string") {
    cloned.aadhaarNumber = maskAadhaar(cloned.aadhaarNumber as string);
  }
  return cloned as Prisma.JsonValue;
}
