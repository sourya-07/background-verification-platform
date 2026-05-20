import { Request, Response } from "express";
import { z } from "zod";
import { AADHAAR_REGEX, PAN_REGEX } from "../utils/constants";
import {
  AadhaarVerifyResponse,
  PanVerifyResponse,
} from "../types";

/**
 * Mock Aadhaar verification.
 *
 * This pretends to be a third-party UIDAI-style API. In real life this
 * call would hit an external HTTPS endpoint, return signed XML, etc. —
 * we stub all of that out with a regex check so the rest of the system
 * can be exercised end-to-end.
 */
const aadhaarSchema = z.object({
  aadhaarNumber: z.string(),
});

export async function verifyAadhaar(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = aadhaarSchema.safeParse(req.body);

  // We deliberately *don't* echo the submitted Aadhaar back into the
  // failure response — real APIs do the same to avoid pointless leaks.
  if (!parsed.success || !AADHAAR_REGEX.test(parsed.data.aadhaarNumber)) {
    const body: AadhaarVerifyResponse = {
      status: "failed",
      message: "Invalid Aadhaar",
    };
    res.status(200).json(body);
    return;
  }

  const body: AadhaarVerifyResponse = {
    status: "verified",
    nameMatch: true,
    dobMatch: true,
    message: "Aadhaar verified successfully",
  };
  res.json(body);
}

const panSchema = z.object({
  panNumber: z.string(),
});

export async function verifyPan(req: Request, res: Response): Promise<void> {
  const parsed = panSchema.safeParse(req.body);

  if (!parsed.success || !PAN_REGEX.test(parsed.data.panNumber)) {
    const body: PanVerifyResponse = {
      status: "failed",
      message: "Invalid PAN",
    };
    res.status(200).json(body);
    return;
  }

  const body: PanVerifyResponse = {
    status: "verified",
    panStatus: "active",
    message: "PAN verified successfully",
  };
  res.json(body);
}
