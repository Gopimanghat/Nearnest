import { Link } from "react-router-dom";

const PRICE_LABELS = {
  1: "₹",
  2: "₹₹",
  3: "₹₹₹",
};

function getStarRating(ratingValue) {
  const value = Math.max(0, Math.min(5, Math.round(Number(ratingValue) || 0)));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function RestaurantCard({ restaurant }) {
  const restaurantId = restaurant.id;
  const name = restaurant.name || "Unnamed Restaurant";
  const cuisine =
    restaurant.cuisine || restaurant.cuisine_type || "Cuisine not provided";
  const area = restaurant.area || restaurant.location || "Location not provided";
  const rating = Number(restaurant.average_rating ?? restaurant.rating ?? 0);
  const priceValue = Number(restaurant.price_range ?? restaurant.price ?? 2);
  const priceRange =
    PRICE_LABELS[Math.max(1, Math.min(3, Math.round(priceValue)))] || "₹₹";
  const description = restaurant.description || "No description available yet.";

  return (
    <Link
      to={`/restaurant/${restaurantId}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={`View details for ${name}`}
    >
      <article>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {priceRange}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-1">{cuisine}</span>
          <span className="text-slate-400">•</span>
          <span>{area}</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-amber-500">{getStarRating(rating)}</span>
          <span className="text-sm text-slate-500">
            {rating.toFixed(1)} average rating
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </article>
    </Link>
  );
}

export default RestaurantCard;
