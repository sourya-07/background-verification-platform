import type { ReactNode } from "react";

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-accent-50 text-accent-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
};

export function StatsCard({ label, value, icon, tone = "default" }: Props) {
  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-primary-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="mt-1 text-3xl font-bold text-primary-900">{value}</div>
      </div>
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center ${TONE_STYLES[tone]}`}
      >
        {icon}
      </div>
    </div>
  );
}
