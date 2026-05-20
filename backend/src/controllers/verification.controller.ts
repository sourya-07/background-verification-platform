import { Request, Response } from "express";
import { runVerification } from "../services/verification.service";
import { Unauthorized } from "../utils/httpError";

export async function startVerification(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) throw Unauthorized();
  const result = await runVerification(req.user.userId, req.params.candidateId);
  res.status(200).json({
    success: true,
    message: "Verification complete",
    data: result,
  });
}
