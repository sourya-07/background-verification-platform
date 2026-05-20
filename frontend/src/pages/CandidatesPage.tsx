import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, Eye } from "lucide-react";

import { StatusBadge } from "../components/StatusBadge";
import {
  deleteCandidate,
  listCandidates,
} from "../services/candidate.service";
import { STATUS_OPTIONS, type StatusFilter } from "../utils/constants";
import { formatDate, getErrorMessage } from "../utils/format";
import type { Candidate } from "../types";

const PAGE_SIZE = 10;

export function CandidatesPage() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const data = await listCandidates({
        search: search.trim() || undefined,
        // Backend doesn't accept "ALL" — translate it to "no filter".
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setItems(data);
      setPage(1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load candidates"));
    } finally {
      setLoading(false);
    }
  }

  // Refetch when status changes. Search is triggered explicitly by the
  // user pressing Enter / clicking the button — debouncing on every
  // keystroke felt wasteful for a small list.
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Initial load.
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  );

  async function handleDelete(candidateId: string, name: string) {
    const ok = window.confirm(
      `Delete candidate "${name}"? This also removes their verification logs.`
    );
    if (!ok) return;
    try {
      await deleteCandidate(candidateId);
      setItems((prev) => prev.filter((c) => c.id !== candidateId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete candidate"));
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Candidates</h1>
          <p className="text-sm text-primary-500 mt-1">
            {items.length} {items.length === 1 ? "candidate" : "candidates"} in your
            workspace
          </p>
        </div>
        <Link to="/candidates/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New candidate
        </Link>
      </header>

      <div className="card p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form
            className="flex-1 relative"
            onSubmit={(e) => {
              e.preventDefault();
              reload();
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="input pl-9"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="input md:w-48"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-primary-500 bg-primary-50/50">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Aadhaar</th>
                <th className="px-5 py-3 font-medium">PAN</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-primary-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-primary-500">
                    No candidates match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                pageItems.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-primary-100 hover:bg-primary-50/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/candidates/${c.id}`}
                        className="font-medium text-primary-900 hover:text-accent"
                      >
                        {c.fullName}
                      </Link>
                      <div className="text-xs text-primary-400">
                        Added {formatDate(c.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-primary-600">{c.email}</td>
                    <td className="px-5 py-3 text-primary-600">{c.phone}</td>
                    <td className="px-5 py-3 font-mono text-xs text-primary-700">
                      {c.aadhaarNumber}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-primary-700">
                      {c.panNumber}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/candidates/${c.id}`}
                          className="p-2 rounded-md hover:bg-primary-100 text-primary-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id, c.fullName)}
                          className="p-2 rounded-md hover:bg-rose-50 text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-primary-100 text-sm">
            <div className="text-primary-500">
              Page {page} of {pages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
