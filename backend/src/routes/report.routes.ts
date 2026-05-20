import { Router } from "express";
import { downloadReport } from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/:candidateId", asyncHandler(downloadReport));

export { router as reportRouter };
