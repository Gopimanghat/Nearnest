import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AdminDashboard() {
  const navigate = useNavigate();
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [pendingOwnerCount, setPendingOwnerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCounts = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [restaurantResponse, ownersResponse] = await Promise.all([
        fetch("http://localhost:5000/api/admin/restaurants"),
        fetch("http://localhost:5000/api/owners/pending"),
      ]);

      if (!restaurantResponse.ok) throw new Error("Failed to fetch restaurants.");
      if (!ownersResponse.ok) throw new Error("Failed to fetch pending owners.");

      const restaurantData = await restaurantResponse.json();
      const ownersData = await ownersResponse.json();

      setRestaurantCount(Array.isArray(restaurantData) ? restaurantData.length : 0);
      setPendingOwnerCount(Array.isArray(ownersData) ? ownersData.length : 0);
    } catch (err) {
      setError(err.message || "Could not load admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

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
              Admin Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Home
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

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">🍽️ Restaurants</h2>
            <p className="mt-2 text-sm text-slate-600">Total restaurants</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {isLoading ? "-" : restaurantCount}
            </p>
            <button
              type="button"
              onClick={() => navigate("/admin/restaurants")}
              className="mt-5 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Manage Restaurants
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">👥 Owners</h2>
            <p className="mt-2 text-sm text-slate-600">Pending owner requests</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {isLoading ? "-" : pendingOwnerCount}
            </p>
            <button
              type="button"
              onClick={() => navigate("/admin/owners")}
              className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Manage Owners
            </button>
          </article>
        </section>

        {isLoading && (
          <div className="mt-4 text-sm text-slate-600">
            Loading dashboard data...
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;
