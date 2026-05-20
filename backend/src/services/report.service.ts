import puppeteer, { Browser } from "puppeteer";
import { prisma } from "../config/db";
import { Forbidden, NotFound } from "../utils/httpError";
import { maskAadhaar } from "../utils/maskers";
import { VerificationStatus, VerificationType } from "../utils/constants";

/**
 * We reuse a single Puppeteer browser instance across requests. Spawning
 * Chromium per request takes ~1s — not great for a /reports endpoint.
 *
 * The instance is lazily created on first use and reconnected if it
 * dies. In a real deployment you'd want to bound max concurrent pages.
 */
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  const browser = await browserPromise;
  // If the browser was closed somehow, reset and recurse.
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

export interface ReportPdf {
  filename: string;
  buffer: Buffer;
}

export async function generateReportPdf(
  userId: string,
  candidateId: string
): Promise<ReportPdf> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      verificationLogs: { orderBy: { verifiedAt: "desc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!candidate) throw NotFound("Candidate not found");
  if (candidate.createdById !== userId) throw Forbidden();

  // Find the latest log for each type so the report reflects the most
  // recent run, even if the candidate has been re-verified.
  const latestAadhaar = candidate.verificationLogs.find(
    (l) => l.verificationType === VerificationType.AADHAAR
  );
  const latestPan = candidate.verificationLogs.find(
    (l) => l.verificationType === VerificationType.PAN
  );

  const html = buildReportHtml({
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    candidatePhone: candidate.phone,
    maskedAadhaar: maskAadhaar(candidate.aadhaarNumber),
    pan: candidate.panNumber,
    aadhaarStatus: latestAadhaar?.verificationStatus ?? "not_run",
    panStatus: latestPan?.verificationStatus ?? "not_run",
    overallStatus: candidate.status,
    generatedOn: formatDate(new Date()),
    verifiedBy: candidate.createdBy.name,
    verifiedByEmail: candidate.createdBy.email,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    // Puppeteer returns a Uint8Array; convert for the Node response stream.
    const pdf = Buffer.from(pdfBytes);

    // Strip anything weird from the candidate name for the filename.
    const safeName = candidate.fullName.replace(/[^a-zA-Z0-9_-]+/g, "_");
    return {
      filename: `BGV_Report_${safeName}.pdf`,
      buffer: pdf,
    };
  } finally {
    await page.close();
  }
}

function formatDate(d: Date): string {
  // Format: 20-May-2026
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

interface ReportData {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  maskedAadhaar: string;
  pan: string;
  aadhaarStatus: string;
  panStatus: string;
  overallStatus: string;
  generatedOn: string;
  verifiedBy: string;
  verifiedByEmail: string;
}

/**
 * Builds the HTML for the PDF. Inline CSS only — Puppeteer renders an
 * isolated page and external stylesheets would just slow us down.
 */
function buildReportHtml(data: ReportData): string {
  const aadhaarOk = data.aadhaarStatus === "verified";
  const panOk = data.panStatus === "verified";

  const badge = (label: string, ok: boolean, notRun: boolean): string => {
    if (notRun) {
      return `<span style="color:#64748b;font-weight:600">NOT RUN</span>`;
    }
    const color = ok ? "#10B981" : "#F43F5E";
    const mark = ok ? "&#10003;" : "&#10007;";
    return `<span style="color:${color};font-weight:700">${label.toUpperCase()} ${mark}</span>`;
  };

  const overallColor =
    data.overallStatus === VerificationStatus.VERIFIED
      ? "#10B981"
      : data.overallStatus === VerificationStatus.FAILED
        ? "#F43F5E"
        : data.overallStatus === VerificationStatus.PARTIAL
          ? "#F59E0B"
          : "#64748b";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Background Verification Report</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 "Helvetica Neue", Arial, sans-serif;
    color: #0F172A;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  .header {
    border-bottom: 3px solid #6366F1;
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  .brand {
    font-size: 13px;
    color: #6366F1;
    letter-spacing: 2px;
    font-weight: 700;
    text-transform: uppercase;
  }
  h1 {
    font-size: 24px;
    margin: 6px 0 0;
    color: #0F172A;
    letter-spacing: 0.4px;
  }
  .subtitle {
    color: #475569;
    font-size: 12px;
    margin-top: 4px;
  }
  .section {
    margin-bottom: 24px;
  }
  .section-title {
    font-size: 11px;
    color: #6366F1;
    letter-spacing: 1.5px;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  table.info {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  table.info td {
    padding: 6px 0;
    vertical-align: top;
  }
  table.info td.label {
    width: 35%;
    color: #64748b;
    font-weight: 500;
  }
  table.info td.value {
    color: #0F172A;
    font-weight: 600;
  }
  .verification-grid {
    display: flex;
    gap: 16px;
  }
  .verification-card {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
  }
  .verification-card .vtype {
    font-size: 11px;
    color: #64748b;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .verification-card .vresult {
    font-size: 18px;
  }
  .overall {
    border: 2px solid ${overallColor};
    border-radius: 10px;
    padding: 18px 20px;
    text-align: center;
    background: #f8fafc;
  }
  .overall .status {
    font-size: 28px;
    font-weight: 800;
    color: ${overallColor};
    letter-spacing: 2px;
  }
  .overall .label {
    font-size: 11px;
    color: #64748b;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .footer {
    margin-top: 36px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #64748b;
  }
  .signature {
    margin-top: 36px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .sig-block {
    width: 45%;
  }
  .sig-line {
    border-bottom: 1px solid #0F172A;
    height: 30px;
  }
  .sig-caption {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">BGV Platform</div>
    <h1>Background Verification Report</h1>
    <div class="subtitle">Confidential — for authorized recipients only</div>
  </div>

  <div class="section">
    <div class="section-title">Candidate Information</div>
    <table class="info">
      <tr><td class="label">Full Name</td><td class="value">${escapeHtml(data.candidateName)}</td></tr>
      <tr><td class="label">Email</td><td class="value">${escapeHtml(data.candidateEmail)}</td></tr>
      <tr><td class="label">Phone</td><td class="value">${escapeHtml(data.candidatePhone)}</td></tr>
      <tr><td class="label">Aadhaar Number</td><td class="value">${escapeHtml(data.maskedAadhaar)}</td></tr>
      <tr><td class="label">PAN Number</td><td class="value">${escapeHtml(data.pan)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Verification Results</div>
    <div class="verification-grid">
      <div class="verification-card">
        <div class="vtype">Aadhaar</div>
        <div class="vresult">${badge(data.aadhaarStatus, aadhaarOk, data.aadhaarStatus === "not_run")}</div>
      </div>
      <div class="verification-card">
        <div class="vtype">PAN</div>
        <div class="vresult">${badge(data.panStatus, panOk, data.panStatus === "not_run")}</div>
      </div>
    </div>
  </div>

  <div class="section overall">
    <div class="label">Overall Status</div>
    <div class="status">${escapeHtml(data.overallStatus)}</div>
  </div>

  <div class="section">
    <table class="info">
      <tr><td class="label">Generated On</td><td class="value">${escapeHtml(data.generatedOn)}</td></tr>
      <tr><td class="label">Verified By</td><td class="value">${escapeHtml(data.verifiedBy)} &lt;${escapeHtml(data.verifiedByEmail)}&gt;</td></tr>
    </table>
  </div>

  <div class="signature">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-caption">Authorized Signatory</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-caption">Date</div>
    </div>
  </div>

  <div class="footer">
    This report was generated by the BGV Platform. The results are based
    on the data submitted at the time of verification and the response
    received from upstream KYC providers.
  </div>
</body>
</html>`;
}

// Minimal HTML escaping — Puppeteer renders untrusted strings, so we
// always sanitize before injecting them into the template.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
