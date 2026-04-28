import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function getStatusBadgeClass(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function AdminOwners() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const fetchOwners = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/owners/all`);
      if (!response.ok) throw new Error("Failed to fetch owners.");
      const data = await response.json();
      setOwners(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load owners.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const updateOwnerStatus = async (ownerId, action) => {
    try {
      setError("");
      setBusyId(String(ownerId));
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/owners/${ownerId}/${action}`,
        { method: "PATCH" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update owner status.");
      }
      await fetchOwners();
    } catch (err) {
      setError(err.message || "Could not update owner status.");
    } finally {
      setBusyId("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Manage Owners</h1>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center text-slate-600">
              Loading owners...
            </div>
          ) : owners.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600">
              No owners registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Signup Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {owners.map((owner) => {
                    const ownerId = String(owner.id);
                    const isBusy = busyId === ownerId;
                    const status = owner.status || "pending";
                    return (
                      <tr key={ownerId}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {owner.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {owner.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {owner.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatDate(owner.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {status === "pending" ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => updateOwnerStatus(ownerId, "approve")}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => updateOwnerStatus(ownerId, "reject")}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">No actions</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminOwners;
