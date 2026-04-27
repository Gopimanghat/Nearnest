import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard";

const PRICE_OPTIONS = ["₹", "₹₹", "₹₹₹"];

function getCuisineValue(restaurant) {
  return (restaurant.cuisine || restaurant.cuisine_type || "").trim();
}

function getAreaValue(restaurant) {
  return (restaurant.area || restaurant.location || "").trim();
}

function getPriceLabel(restaurant) {
  const rawValue = Number(restaurant.price_range ?? restaurant.price ?? 2);
  const safeValue = Math.max(1, Math.min(3, Math.round(rawValue)));
  return PRICE_OPTIONS[safeValue - 1];
}

function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  const [lastAiQuery, setLastAiQuery] = useState("");
  const [aiError, setAiError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:5000/api/restaurants");

        if (!response.ok) {
          throw new Error("Could not load restaurants from the server.");
        }

        const data = await response.json();
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Something went wrong while fetching data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const cuisineOptions = useMemo(() => {
    const values = restaurants
      .map((restaurant) => getCuisineValue(restaurant))
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  const areaOptions = useMemo(() => {
    const values = restaurants
      .map((restaurant) => getAreaValue(restaurant))
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const name = (restaurant.name || "").toLowerCase();
      const cuisine = getCuisineValue(restaurant);
      const area = getAreaValue(restaurant);
      const price = getPriceLabel(restaurant);

      const matchesSearch =
        !normalizedQuery || name.includes(normalizedQuery);
      const matchesCuisine = !selectedCuisine || cuisine === selectedCuisine;
      const matchesArea = !selectedArea || area === selectedArea;
      const matchesPrice = !selectedPrice || price === selectedPrice;

      return matchesSearch && matchesCuisine && matchesArea && matchesPrice;
    });
  }, [restaurants, searchQuery, selectedCuisine, selectedArea, selectedPrice]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCuisine("");
    setSelectedArea("");
    setSelectedPrice("");
  };

  const hasActiveFilters =
    searchQuery || selectedCuisine || selectedArea || selectedPrice;
  const displayedRestaurants = isAiActive ? aiResults : filteredRestaurants;

  const handleAiSearch = async () => {
    const query = aiQuery.trim();
    if (!query) return;

    try {
      setIsAiSearching(true);
      setAiError("");
      const response = await fetch("http://localhost:5000/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "AI search failed.");
      }

      const data = await response.json();
      setAiResults(Array.isArray(data) ? data : []);
      setIsAiActive(true);
      setLastAiQuery(query);
    } catch (err) {
      setAiError(err.message || "AI search failed.");
      setIsAiActive(false);
      setAiResults([]);
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiQuery("");
    setAiResults([]);
    setIsAiActive(false);
    setLastAiQuery("");
    setAiError("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-700">
                Kozhikode Restaurant Discovery
              </p>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Find great places to eat in the city
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Explore trusted local restaurants, compare ratings and price range,
                and pick your next meal spot in seconds.
              </p>
            </div>
            {/* Owner Dashboard Button - Hidden for now */}
            {/* <Link
              to="/owner/dashboard"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Owner Dashboard
            </Link> */}
          </div>
        </header>

        {!isLoading && !error && restaurants.length > 0 && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={aiQuery}
                onChange={(event) => setAiQuery(event.target.value)}
                placeholder="Try: cheap biryani open after 9pm..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={handleAiSearch}
                disabled={isAiSearching || !aiQuery.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAiSearching ? "AI is thinking..." : "Search"}
              </button>
              {isAiActive && (
                <button
                  type="button"
                  onClick={clearAiSearch}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear AI Search
                </button>
              )}
            </div>
            {aiError && (
              <p className="mt-3 text-sm text-red-700">{aiError}</p>
            )}
            {isAiActive && (
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {aiResults.length}
                </span>{" "}
                restaurants found for: <span className="font-medium">{lastAiQuery}</span>
              </p>
            )}
          </section>
        )}

        {!isLoading && !error && restaurants.length > 0 && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <label className="lg:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by restaurant name..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cuisine
                </span>
                <select
                  value={selectedCuisine}
                  onChange={(event) => setSelectedCuisine(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All cuisines</option>
                  {cuisineOptions.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Area
                </span>
                <select
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All areas</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price range
                </span>
                <select
                  value={selectedPrice}
                  onChange={(event) => setSelectedPrice(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All prices</option>
                  {PRICE_OPTIONS.map((price) => (
                    <option key={price} value={price}>
                      {price}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredRestaurants.length}
                </span>{" "}
                of {restaurants.length} restaurants
              </p>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
          </section>
        )}

        {isLoading && (
          <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
              <span className="text-sm font-medium">Loading restaurants...</span>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && restaurants.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-slate-600">
            No restaurants found right now.
          </div>
        )}

        {!isLoading && !error && restaurants.length > 0 && displayedRestaurants.length === 0 && (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
              {isAiActive
                ? "No restaurants match your AI search."
                : "No restaurants match your current filters."}
            </div>
          </section>
        )}

        {!isLoading && !error && displayedRestaurants.length > 0 && (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedRestaurants.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id || restaurant.name || index}
                restaurant={restaurant}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default HomePage;
