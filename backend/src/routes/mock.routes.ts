import { Router } from "express";
import { verifyAadhaar, verifyPan } from "../controllers/mock.controller";
import { asyncHandler } from "../utils/asyncHandler";

// These endpoints simulate external KYC providers. They live on a
// different route prefix (/mock-api) so it's visually obvious in logs
// whether a request is real-app traffic or simulated upstream traffic.
const router = Router();

router.post("/aadhaar/verify", asyncHandler(verifyAadhaar));
router.post("/pan/verify", asyncHandler(verifyPan));

export { router as mockRouter };
