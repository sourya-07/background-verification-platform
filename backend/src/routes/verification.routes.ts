import { Router } from "express";
import { startVerification } from "../controllers/verification.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.post("/:candidateId/start", asyncHandler(startVerification));

export { router as verificationRouter };
