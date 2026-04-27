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
      className="group relative block h-full overflow-hidden rounded-2xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(234,88,12,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(234,88,12,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      aria-label={`View details for ${name}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <article className="flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-800 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {name}
          </h2>
          <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-600 shadow-sm">
            {priceRange}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
            {cuisine}
          </span>
          <span className="flex items-center text-slate-500 font-medium ml-1">
            <span role="img" aria-label="pin" className="mr-1">📍</span> {area}
          </span>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xl tracking-widest text-amber-400">
            {getStarRating(rating)}
          </span>
          <span className="text-sm font-medium text-slate-500">
            ({rating.toFixed(1)})
          </span>
        </div>

        <p className="mt-auto text-sm leading-relaxed text-slate-500 line-clamp-3">
          {description}
        </p>
      </article>

      {/* Bottom Orange Hover Line */}
      <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-orange-500 transition-transform duration-300 group-hover:scale-x-100"></div>
    </Link>
  );
}

export default RestaurantCard;
