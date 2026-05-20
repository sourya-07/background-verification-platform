import { Request, Response } from "express";
import { Unauthorized } from "../utils/httpError";
import {
  createCandidate,
  deleteCandidate,
  getCandidateById,
  getStats,
  listCandidates,
  updateCandidate,
} from "../services/candidate.service";
import {
  CandidateCreateInput,
  CandidateListQuery,
  CandidateUpdateInput,
} from "../validations/candidate.validation";

function userIdFrom(req: Request): string {
  // The auth middleware guarantees req.user, but TS doesn't know that
  // statically — this tiny helper centralizes the check.
  if (!req.user) throw Unauthorized();
  return req.user.userId;
}

export async function create(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const candidate = await createCandidate(
    userId,
    req.body as CandidateCreateInput
  );
  res.status(201).json({
    success: true,
    message: "Candidate created",
    data: candidate,
  });
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const candidates = await listCandidates(
    userId,
    req.query as unknown as CandidateListQuery
  );
  res.status(200).json({
    success: true,
    message: "Candidates fetched",
    data: candidates,
  });
}

export async function detail(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const data = await getCandidateById(userId, req.params.id);
  res.status(200).json({
    success: true,
    message: "Candidate fetched",
    data,
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const candidate = await updateCandidate(
    userId,
    req.params.id,
    req.body as CandidateUpdateInput
  );
  res.status(200).json({
    success: true,
    message: "Candidate updated",
    data: candidate,
  });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  await deleteCandidate(userId, req.params.id);
  res.status(200).json({
    success: true,
    message: "Candidate deleted",
  });
}

export async function stats(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const data = await getStats(userId);
  res.status(200).json({
    success: true,
    message: "Stats fetched",
    data,
  });
}
