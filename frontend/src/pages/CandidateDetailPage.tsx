import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Play,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldX,
  Fingerprint,
  IdCard,
} from "lucide-react";

import { StatusBadge } from "../components/StatusBadge";
import { getCandidate } from "../services/candidate.service";
import { startVerification } from "../services/verification.service";
import { downloadReport } from "../services/report.service";
import { formatDate, formatDateTime, getErrorMessage } from "../utils/format";
import type { CandidateDetail, VerificationLog } from "../types";

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCandidate(id);
      setData(res);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load candidate"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRunVerification() {
    if (!id) return;
    setRunning(true);
    setError(null);
    try {
      await startVerification(id);
      // Easiest way to reflect the new logs + status is to refetch.
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed"));
    } finally {
      setRunning(false);
    }
  }

  async function handleDownload() {
    if (!id || !data) return;
    setDownloading(true);
    try {
      await downloadReport(id, data.candidate.fullName);
    } catch (err) {
      setError(getErrorMessage(err, "Could not download report"));
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <div className="text-primary-500">Loading candidate…</div>;
  }

  if (!data) {
    return (
      <div>
        <Link to="/candidates" className="text-accent text-sm">
          ← Back to candidates
        </Link>
        <div className="mt-4 text-rose-700">{error ?? "Not found"}</div>
      </div>
    );
  }

  const { candidate, verificationLogs } = data;
  const hasLogs = verificationLogs.length > 0;

  return (
    <div>
      <Link
        to="/candidates"
        className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to candidates
      </Link>

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary-900">
              {candidate.fullName}
            </h1>
            <StatusBadge status={candidate.status} />
          </div>
          <p className="text-sm text-primary-500 mt-1">
            Added on {formatDate(candidate.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunVerification}
            disabled={running}
            className="btn-primary"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {hasLogs ? "Re-run verification" : "Start verification"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-secondary"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download report
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-primary-700">
            Personal information
          </h2>
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
            {candidate.email}
          </InfoRow>
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone">
            {candidate.phone}
          </InfoRow>
          <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of birth">
            {formatDate(candidate.dob)}
          </InfoRow>
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address">
            {candidate.address}
          </InfoRow>
          <InfoRow icon={<Fingerprint className="h-4 w-4" />} label="Aadhaar">
            <span className="font-mono">{candidate.aadhaarNumber}</span>
          </InfoRow>
          <InfoRow icon={<IdCard className="h-4 w-4" />} label="PAN">
            <span className="font-mono">{candidate.panNumber}</span>
          </InfoRow>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-primary-700 mb-4">
            Verification timeline
          </h2>
          {!hasLogs ? (
            <div className="text-sm text-primary-500">
              No verifications have been run yet. Click "Start verification" to
              run Aadhaar and PAN checks.
            </div>
          ) : (
            <ul className="space-y-3">
              {verificationLogs.map((log) => (
                <TimelineItem key={log.id} log={log} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-md bg-primary-50 flex items-center justify-center text-primary-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-primary-400">
          {label}
        </div>
        <div className="text-sm text-primary-800 break-words">{children}</div>
      </div>
    </div>
  );
}

function TimelineItem({ log }: { log: VerificationLog }) {
  const [open, setOpen] = useState(false);
  const ok = log.verificationStatus === "verified";

  return (
    <li className="border border-primary-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50"
      >
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center ${
            ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          {ok ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <ShieldX className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-primary-900">
            {log.verificationType} verification —{" "}
            <span className={ok ? "text-emerald-600" : "text-rose-600"}>
              {log.verificationStatus}
            </span>
          </div>
          <div className="text-xs text-primary-500">
            {formatDateTime(log.verifiedAt)}
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-primary-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-primary-400" />
        )}
      </button>
      {open && (
        <div className="bg-primary-50/60 border-t border-primary-200 px-4 py-3 space-y-3">
          <PayloadBlock title="Request payload" value={log.requestPayload} />
          <PayloadBlock title="Response payload" value={log.responsePayload} />
        </div>
      )}
    </li>
  );
}

function PayloadBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-primary-400 mb-1">
        {title}
      </div>
      <pre className="text-xs bg-primary-900 text-primary-100 rounded-md p-3 overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
