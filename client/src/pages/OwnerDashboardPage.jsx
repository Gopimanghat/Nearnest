import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PRICE_OPTIONS = [
  { label: "₹", value: "1" },
  { label: "₹₹", value: "2" },
  { label: "₹₹₹", value: "3" },
];

const initialFormState = {
  name: "",
  cuisine_type: "",
  area: "",
  address: "",
  phone: "",
  whatsapp: "",
  description: "",
  opening_time: "",
  closing_time: "",
  price_range: "2",
};

function OwnerDashboardPage() {
  const navigate = useNavigate();
  const [ownerStatus, setOwnerStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [existingRestaurantId, setExistingRestaurantId] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboardData = async () => {
    setStatusLoading(true);
    setErrorMessage("");
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        throw new Error("Could not determine logged in user.");
      }

      const email = String(user.email).trim();
      setOwnerEmail(email);

      const encodedEmail = encodeURIComponent(email);
      const statusResponse = await fetch(
        `http://localhost:5000/api/owners/status/${encodedEmail}`
      );
      const statusData = await statusResponse.json().catch(() => ({}));
      if (!statusResponse.ok) {
        throw new Error(statusData.error || "Could not fetch owner status.");
      }

      const status = statusData.status || "";
      setOwnerStatus(status);

      if (status === "approved") {
        const restaurantResponse = await fetch(
          `http://localhost:5000/api/restaurants?email=${encodeURIComponent(email)}`
        );
        const restaurantData = await restaurantResponse.json().catch(() => []);
        if (!restaurantResponse.ok) {
          throw new Error("Could not fetch owner restaurant.");
        }

        const existing = Array.isArray(restaurantData) ? restaurantData[0] : null;
        if (existing) {
          setExistingRestaurantId(String(existing.id));
          setFormData({
            name: existing.name || "",
            cuisine_type: existing.cuisine_type || "",
            area: existing.area || "",
            address: existing.address || "",
            phone: existing.phone || "",
            whatsapp: existing.whatsapp || "",
            description: existing.description || "",
            opening_time: existing.opening_time || "",
            closing_time: existing.closing_time || "",
            price_range: String(existing.price_range ?? "2"),
          });
        } else {
          setExistingRestaurantId("");
          setFormData(initialFormState);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || "Could not load dashboard.");
      setOwnerStatus("");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        price_range: Number(formData.price_range),
      };

      let response;
      if (existingRestaurantId) {
        response = await fetch(
          `http://localhost:5000/api/restaurants/${existingRestaurantId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch("http://localhost:5000/api/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            owner_email: ownerEmail,
          }),
        });
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to save restaurant.");
      }

      setSuccessMessage(
        existingRestaurantId
          ? "Restaurant updated and sent for admin review."
          : "Restaurant added successfully."
      );

      if (!existingRestaurantId && data?.id) {
        setExistingRestaurantId(String(data.id));
      }
    } catch (error) {
      setErrorMessage(error.message || "Could not save restaurant.");
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              Owner Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {existingRestaurantId ? "Edit Restaurant" : "Add Restaurant"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Go to Home
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {errorMessage && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {statusLoading && (
            <div className="text-sm text-slate-600">Checking account status...</div>
          )}

          {!statusLoading && ownerStatus === "pending" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
              Your account is pending admin approval. Please wait.
            </div>
          )}

          {!statusLoading && ownerStatus === "rejected" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-red-700">
              Your registration was rejected. Contact admin for more info.
            </div>
          )}

          {!statusLoading && ownerStatus === "approved" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Restaurant name *
                  </span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Cuisine type *
                  </span>
                  <input
                    name="cuisine_type"
                    value={formData.cuisine_type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Area *
                  </span>
                  <input
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Address
                  </span>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Phone
                  </span>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    WhatsApp
                  </span>
                  <input
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Opening time
                  </span>
                  <input
                    type="time"
                    name="opening_time"
                    value={formData.opening_time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Closing time
                  </span>
                  <input
                    type="time"
                    name="closing_time"
                    value={formData.closing_time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Price range
                  </span>
                  <select
                    name="price_range"
                    value={formData.price_range}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {PRICE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Description
                  </span>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {successMessage && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : existingRestaurantId
                  ? "Update restaurant"
                  : "Add restaurant"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default OwnerDashboardPage;
