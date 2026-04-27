import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const initialRestaurantForm = {
  name: "",
  cuisine_type: "",
  area: "",
  address: "",
  phone: "",
  whatsapp_number: "",
  description: "",
  opening_time: "",
  closing_time: "",
  price_range: "2",
};

function getStatusBadgeClass(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function AdminRestaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [formData, setFormData] = useState(initialRestaurantForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [expandedRestaurantId, setExpandedRestaurantId] = useState("");

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/admin/restaurants");
      if (!response.ok) throw new Error("Failed to fetch restaurants.");
      const data = await response.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load restaurants.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleUpdateStatus = async (restaurantId, status) => {
    try {
      setActionError("");
      setBusyId(String(restaurantId));
      const response = await fetch(
        `http://localhost:5000/api/restaurants/${restaurantId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status.");
      }

      await fetchRestaurants();
    } catch (err) {
      setActionError(err.message || "Could not update status.");
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (restaurantId) => {
    try {
      setActionError("");
      setBusyId(String(restaurantId));
      const response = await fetch(
        `http://localhost:5000/api/restaurants/${restaurantId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete restaurant.");
      }
      await fetchRestaurants();
    } catch (err) {
      setActionError(err.message || "Could not delete restaurant.");
    } finally {
      setBusyId("");
    }
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddRestaurant = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setActionError("");

    try {
      const response = await fetch("http://localhost:5000/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price_range: Number(formData.price_range),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to add restaurant.");
      }

      setSubmitMessage("Restaurant added successfully.");
      setFormData(initialRestaurantForm);
      await fetchRestaurants();
    } catch (err) {
      setActionError(err.message || "Could not add restaurant.");
    } finally {
      setIsSubmitting(false);
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
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Manage Restaurants
            </h1>
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

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Restaurant</h2>
          <form onSubmit={handleAddRestaurant} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                name="name"
                value={formData.name}
                onChange={handleAddChange}
                placeholder="Restaurant name"
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="cuisine_type"
                value={formData.cuisine_type}
                onChange={handleAddChange}
                placeholder="Cuisine type"
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="area"
                value={formData.area}
                onChange={handleAddChange}
                placeholder="Area"
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                name="price_range"
                value={formData.price_range}
                onChange={handleAddChange}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="1">₹</option>
                <option value="2">₹₹</option>
                <option value="3">₹₹₹</option>
              </select>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleAddChange}
                placeholder="Phone"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleAddChange}
                placeholder="WhatsApp"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="address"
                value={formData.address}
                onChange={handleAddChange}
                placeholder="Address"
                className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleAddChange}
                placeholder="Description"
                rows={3}
                className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {submitMessage && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {submitMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Adding..." : "Add restaurant"}
            </button>
          </form>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center text-slate-600">
              Loading restaurants...
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
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Cuisine
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
                  {restaurants.map((restaurant) => {
                    const restaurantId = String(restaurant.id);
                    const isBusy = busyId === restaurantId;
                    const status = restaurant.status || "pending";

                    return (
                      [
                      <tr key={`row-${restaurantId}`}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {restaurant.name || "Unnamed"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {restaurant.area || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {restaurant.cuisine_type || "-"}
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
                          <div className="flex flex-wrap gap-2">
                            {status === "pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRestaurantId((prev) =>
                                    prev === restaurantId ? "" : restaurantId
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                              >
                                View Edits
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleUpdateStatus(restaurantId, "approved")
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleUpdateStatus(restaurantId, "rejected")
                              }
                              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(restaurantId)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>,
                      expandedRestaurantId === restaurantId && (
                        <tr key={`details-${restaurantId}`}>
                          <td className="px-4 py-3 text-sm text-slate-700" colSpan={5}>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p><strong>Name:</strong> {restaurant.name || "-"}</p>
                              <p><strong>Cuisine:</strong> {restaurant.cuisine_type || "-"}</p>
                              <p><strong>Area:</strong> {restaurant.area || "-"}</p>
                              <p><strong>Address:</strong> {restaurant.address || "-"}</p>
                              <p><strong>Phone:</strong> {restaurant.phone || "-"}</p>
                              <p><strong>WhatsApp:</strong> {restaurant.whatsapp || "-"}</p>
                              <p><strong>Description:</strong> {restaurant.description || "-"}</p>
                              <p><strong>Opening time:</strong> {restaurant.opening_time || "-"}</p>
                              <p><strong>Closing time:</strong> {restaurant.closing_time || "-"}</p>
                              <p><strong>Price range:</strong> {restaurant.price_range || "-"}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(restaurantId, "approved")
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(restaurantId, "rejected")
                                  }
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                      ]
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

export default AdminRestaurants;
