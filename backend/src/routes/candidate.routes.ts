import { Router } from "express";

import {
  create,
  detail,
  list,
  remove,
  stats,
  update,
} from "../controllers/candidate.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  candidateCreateSchema,
  candidateListQuerySchema,
  candidateUpdateSchema,
} from "../validations/candidate.validation";

const router = Router();

// Every candidate route is behind auth — there's no public list view.
router.use(requireAuth);

// /stats is mounted before /:id so Express doesn't treat "stats" as
// an ID parameter.
router.get("/stats", asyncHandler(stats));

router.post(
  "/",
  validate(candidateCreateSchema),
  asyncHandler(create)
);

router.get(
  "/",
  validate(candidateListQuerySchema, "query"),
  asyncHandler(list)
);

router.get("/:id", asyncHandler(detail));

router.put(
  "/:id",
  validate(candidateUpdateSchema),
  asyncHandler(update)
);

router.delete("/:id", asyncHandler(remove));

export { router as candidateRouter };
