import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StatsCard } from "../components/StatsCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  getStats,
  listCandidates,
} from "../services/candidate.service";
import type { Candidate, DashboardStats } from "../types";
import { formatDate, getErrorMessage } from "../utils/format";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Stats + recent in parallel — they're independent calls.
        const [s, list] = await Promise.all([getStats(), listCandidates()]);
        if (cancelled) return;
        setStats(s);
        setRecent(list.slice(0, 5));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load dashboard"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = stats
    ? [
        { name: "Verified", value: stats.verified, fill: "#10B981" },
        { name: "Pending", value: stats.pending, fill: "#F59E0B" },
        { name: "Partial", value: stats.partial, fill: "#F97316" },
        { name: "Failed", value: stats.failed, fill: "#F43F5E" },
      ]
    : [];

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Dashboard</h1>
          <p className="text-sm text-primary-500 mt-1">
            A snapshot of your verification activity.
          </p>
        </div>
        <Link to="/candidates/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New candidate
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total"
          value={loading ? "—" : stats?.total ?? 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          label="Verified"
          value={loading ? "—" : stats?.verified ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />
        <StatsCard
          label="Pending"
          value={loading ? "—" : stats?.pending ?? 0}
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <StatsCard
          label="Failed"
          value={loading ? "—" : stats?.failed ?? 0}
          icon={<XCircle className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-primary-700 mb-4">
            Verification status breakdown
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-primary-700 mb-3">
            Quick actions
          </h2>
          <div className="space-y-2">
            <Link
              to="/candidates/new"
              className="flex items-center justify-between p-3 rounded-lg border border-primary-200 hover:bg-primary-50"
            >
              <div>
                <div className="text-sm font-medium text-primary-900">
                  Add new candidate
                </div>
                <div className="text-xs text-primary-500">
                  Start a new verification
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-primary-400" />
            </Link>
            <Link
              to="/candidates"
              className="flex items-center justify-between p-3 rounded-lg border border-primary-200 hover:bg-primary-50"
            >
              <div>
                <div className="text-sm font-medium text-primary-900">
                  View all candidates
                </div>
                <div className="text-xs text-primary-500">
                  Filter, search, download reports
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-primary-400" />
            </Link>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between p-5 border-b border-primary-200">
          <h2 className="text-sm font-semibold text-primary-700">
            Recent candidates
          </h2>
          <Link
            to="/candidates"
            className="text-sm text-accent font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-primary-500 bg-primary-50/50">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-primary-500"
                  >
                    No candidates yet. Add your first one to get started.
                  </td>
                </tr>
              )}
              {recent.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-primary-100 hover:bg-primary-50/50"
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/candidates/${c.id}`}
                      className="font-medium text-primary-900 hover:text-accent"
                    >
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-primary-600">{c.email}</td>
                  <td className="px-5 py-3 text-primary-600">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
