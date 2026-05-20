import { Request, Response } from "express";
import { Unauthorized } from "../utils/httpError";
import { generateReportPdf } from "../services/report.service";

export async function downloadReport(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) throw Unauthorized();
  const { filename, buffer } = await generateReportPdf(
    req.user.userId,
    req.params.candidateId
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );
  res.setHeader("Content-Length", buffer.byteLength.toString());
  res.send(buffer);
}
