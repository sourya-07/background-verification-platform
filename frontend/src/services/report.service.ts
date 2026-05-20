import { api } from "./api";

/**
 * Triggers a PDF download for the given candidate. We ask axios for a
 * Blob so the browser doesn't try to interpret the bytes as text.
 *
 * The Content-Disposition header set by the server already contains a
 * filename, but most browsers don't read it for blob URLs — we mirror
 * it here on the anchor.
 */
export async function downloadReport(
  candidateId: string,
  candidateName: string
): Promise<void> {
  const response = await api.get(`/reports/${candidateId}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const safeName = candidateName.replace(/[^a-zA-Z0-9_-]+/g, "_");
  const link = document.createElement("a");
  link.href = url;
  link.download = `BGV_Report_${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Clean up the object URL — keeps memory pressure down on long sessions.
  URL.revokeObjectURL(url);
}
