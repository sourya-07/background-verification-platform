import { Router } from "express";
import { authRouter } from "./auth.routes";
import { candidateRouter } from "./candidate.routes";
import { verificationRouter } from "./verification.routes";
import { reportRouter } from "./report.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/candidates", candidateRouter);
router.use("/verifications", verificationRouter);
router.use("/reports", reportRouter);

export { router as apiRouter };
