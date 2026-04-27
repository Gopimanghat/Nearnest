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
    <main className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero Section */}
      <section className="relative w-full bg-[#1a1a2e] px-4 py-20 sm:px-6 lg:px-8 shadow-xl overflow-hidden">
        {/* Warm Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1a2e] via-[#1a1a2e]/90 to-orange-900/40 pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 
            className="text-4xl font-bold text-white sm:text-5xl md:text-6xl tracking-tight mb-4" 
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Discover Kozhikode's Best
          </h1>
          <p className="text-xl md:text-2xl text-orange-400 font-medium mb-12">
            Restaurants, Cafes & Local Favourites
          </p>
          
          {/* AI Search Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 flex flex-col sm:flex-row items-center gap-2 mb-6">
            <span className="text-3xl pl-4 hidden sm:inline-block" role="img" aria-label="robot">🤖</span>
            <input
              type="text"
              value={aiQuery}
              onChange={(event) => setAiQuery(event.target.value)}
              placeholder="Ask AI... like 'cheap biryani open after 9pm'"
              className="w-full flex-1 bg-transparent px-4 py-3 text-lg text-slate-800 placeholder-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={handleAiSearch}
              disabled={isAiSearching || !aiQuery.trim()}
              className="w-full sm:w-auto rounded-xl bg-orange-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAiSearching ? "Thinking..." : "Search"}
            </button>
          </div>
          
          {aiError && (
            <p className="text-sm text-red-400 mb-4">{aiError}</p>
          )}

          {isAiActive && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <p className="text-sm text-white/90 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                Showing <span className="font-bold text-orange-400">{aiResults.length}</span> results for: <span className="italic">"{lastAiQuery}"</span>
              </p>
              <button
                type="button"
                onClick={clearAiSearch}
                className="text-sm text-white hover:text-orange-300 underline underline-offset-4 transition"
              >
                Clear AI Search
              </button>
            </div>
          )}

          {/* Regular Filters Row */}
          {!isAiActive && restaurants.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name..."
                className="rounded-full border-2 border-white/10 bg-white/5 px-5 py-2 text-sm text-white outline-none placeholder-white/50 backdrop-blur-md transition hover:bg-white/10 focus:border-orange-500 focus:bg-white/10"
              />
              <select
                value={selectedCuisine}
                onChange={(event) => setSelectedCuisine(event.target.value)}
                className="rounded-full border-2 border-white/10 bg-white/5 px-5 py-2 text-sm text-white outline-none backdrop-blur-md transition hover:bg-white/10 focus:border-orange-500 focus:bg-white/10 [&>option]:text-slate-800"
              >
                <option value="">Cuisine</option>
                {cuisineOptions.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
              <select
                value={selectedArea}
                onChange={(event) => setSelectedArea(event.target.value)}
                className="rounded-full border-2 border-white/10 bg-white/5 px-5 py-2 text-sm text-white outline-none backdrop-blur-md transition hover:bg-white/10 focus:border-orange-500 focus:bg-white/10 [&>option]:text-slate-800"
              >
                <option value="">Area</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <select
                value={selectedPrice}
                onChange={(event) => setSelectedPrice(event.target.value)}
                className="rounded-full border-2 border-white/10 bg-white/5 px-5 py-2 text-sm text-white outline-none backdrop-blur-md transition hover:bg-white/10 focus:border-orange-500 focus:bg-white/10 [&>option]:text-slate-800"
              >
                <option value="">Price</option>
                {PRICE_OPTIONS.map((price) => (
                  <option key={price} value={price}>
                    {price}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border-2 border-orange-500/50 text-orange-400 bg-transparent px-4 py-2 text-sm font-medium transition hover:bg-orange-500/10"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
              <span className="text-base font-medium tracking-wide">Loading amazing food...</span>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && restaurants.length > 0 && (
          <div className="mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              {displayedRestaurants.length} restaurants found in Kozhikode
            </h2>
          </div>
        )}

        {!isLoading && !error && restaurants.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            No restaurants found right now.
          </div>
        )}

        {!isLoading && !error && restaurants.length > 0 && displayedRestaurants.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            {isAiActive
              ? "No restaurants match your AI search. Try something else!"
              : "No restaurants match your current filters. Try relaxing them."}
          </div>
        )}

        {!isLoading && !error && displayedRestaurants.length > 0 && (
          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displayedRestaurants.map((restaurant, index) => (
              <div 
                key={restaurant.id || restaurant.name || index}
                className="animate-[fade-in_0.5s_ease-out_both]"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))}
          </section>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </main>
  );
}

export default HomePage;
