import type { VerificationStatus } from "../types";

interface Props {
  status: VerificationStatus | string;
}

// Map status -> Tailwind classes. Kept as a plain object so the bundler
// can tree-shake; a switch statement reads almost the same in TSX.
const STYLES: Record<string, string> = {
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIAL: "bg-orange-50 text-orange-700 border-orange-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusBadge({ status }: Props) {
  const cls = STYLES[status] ?? "bg-primary-100 text-primary-700 border-primary-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}
