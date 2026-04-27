import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const PRICE_LABELS = {
  1: "₹",
  2: "₹₹",
  3: "₹₹₹",
};

function getStarRating(ratingValue) {
  const value = Math.max(0, Math.min(5, Math.round(Number(ratingValue) || 0)));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function toPhoneHref(phone) {
  if (!phone) return "";
  return `tel:${String(phone).replace(/\s+/g, "")}`;
}

function toWhatsAppHref(phone) {
  if (!phone) return "";
  const normalized = String(phone).replace(/[^\d+]/g, "");
  const digitsOnly = normalized.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}`;
}

function formatReviewDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: "",
    rating: 0,
    comment: "",
  });

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/restaurants/${id}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Restaurant not found.");
          }
          throw new Error("Could not load restaurant details.");
        }

        const data = await response.json();
        setRestaurant(data);
      } catch (err) {
        setError(err.message || "Something went wrong while loading details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await fetch(
          `http://localhost:5000/api/restaurants/${id}/reviews`
        );

        if (!response.ok) {
          throw new Error("Could not load reviews.");
        }

        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        setReviewsError(err.message || "Something went wrong while loading reviews.");
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchAiSummary = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/ai/reviews/${id}/summary`
        );
        if (!response.ok) {
          setAiSummary(null);
          return;
        }
        const data = await response.json();
        setAiSummary(data?.summary || null);
      } catch (_err) {
        setAiSummary(null);
      }
    };

    fetchAiSummary();
  }, [id]);

  const details = useMemo(() => {
    if (!restaurant) return null;

    const name = restaurant.name || "Unnamed Restaurant";
    const cuisine =
      restaurant.cuisine || restaurant.cuisine_type || "Cuisine not provided";
    const area = restaurant.area || restaurant.location || "Location not provided";
    const description = restaurant.description || "No description available.";
    const openingTime =
      restaurant.opening_time || restaurant.open_time || restaurant.opens_at;
    const closingTime =
      restaurant.closing_time || restaurant.close_time || restaurant.closes_at;
    const phone = restaurant.phone || restaurant.phone_number || "";
    const rating = Number(restaurant.average_rating ?? restaurant.rating ?? 0);
    const priceValue = Number(restaurant.price_range ?? restaurant.price ?? 2);
    const priceRange =
      PRICE_LABELS[Math.max(1, Math.min(3, Math.round(priceValue)))] || "₹₹";

    return {
      name,
      cuisine,
      area,
      description,
      openingTime: openingTime || "Not specified",
      closingTime: closingTime || "Not specified",
      phone: phone || "Not available",
      phoneHref: toPhoneHref(phone),
      whatsappHref: toWhatsAppHref(phone),
      rating,
      priceRange,
    };
  }, [restaurant]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingSelect = (selectedRating) => {
    setReviewForm((prev) => ({
      ...prev,
      rating: selectedRating,
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const reviewerName = reviewForm.reviewer_name.trim();
    const comment = reviewForm.comment.trim();

    if (!reviewerName) {
      setSubmitError("Please enter your name.");
      return;
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setSubmitError("Please select a rating from 1 to 5.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `http://localhost:5000/api/restaurants/${id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewer_name: reviewerName,
            rating: reviewForm.rating,
            comment,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setReviews((prev) => [data, ...prev]);
      setReviewForm({
        reviewer_name: "",
        rating: 0,
        comment: "",
      });
    } catch (err) {
      setSubmitError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/60">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ← Back to Home
        </Link>

        {isLoading && (
          <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
              <span className="text-sm font-medium">
                Loading restaurant details...
              </span>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && details && (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <header className="mb-5">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {details.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-md bg-slate-100 px-2 py-1">
                  {details.cuisine}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-medium">{details.area}</span>
              </div>
            </header>

            <p className="mb-6 leading-7 text-slate-700">{details.description}</p>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Opening Hours
                </p>
                <p className="mt-1 text-slate-900">
                  {details.openingTime} - {details.closingTime}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price Range
                </p>
                <p className="mt-1 text-slate-900">{details.priceRange}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Average Rating
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-amber-500">
                    {getStarRating(details.rating)}
                  </span>
                  <span className="text-slate-900">{details.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location Area
                </p>
                <p className="mt-1 text-slate-900">{details.area}</p>
              </div>
            </section>

            <section className="mt-6 flex flex-col gap-3 sm:flex-row">
              {details.phoneHref ? (
                <a
                  href={details.phoneHref}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Call {details.phone}
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-500">
                  Phone not available
                </span>
              )}

              {details.whatsappHref ? (
                <a
                  href={details.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Chat on WhatsApp
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-500">
                  WhatsApp not available
                </span>
              )}
            </section>

            <section className="mt-8 border-t border-slate-200 pt-6">
              {aiSummary && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-amber-900">
                    🤖 AI Review Summary
                  </h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">
                    {aiSummary
                      .split("\n")
                      .map((line) => line.trim())
                      .filter((line) => line)
                      .map((line, index) => (
                        <li key={`${line}-${index}`}>
                          {line.replace(/^[-*•]\s*/, "")}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <h2 className="text-2xl font-semibold text-slate-900">Reviews</h2>

              {reviewsLoading && (
                <div className="mt-4 flex items-center gap-3 text-slate-600">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                  <span className="text-sm">Loading reviews...</span>
                </div>
              )}

              {!reviewsLoading && reviewsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reviewsError}
                </div>
              )}

              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No reviews yet, be the first!
                </p>
              )}

              {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="mt-4 space-y-3">
                  {reviews.map((review, index) => (
                    <article
                      key={review.id || `${review.reviewer_name}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">
                          {review.reviewer_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatReviewDate(review.created_at)}
                        </p>
                      </div>
                      <p className="mt-1 text-amber-500">
                        {getStarRating(review.rating)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {review.comment || "No comment provided."}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-slate-900">Add a Review</h3>

                <form className="mt-4 space-y-4" onSubmit={handleReviewSubmit}>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Your name
                    </span>
                    <input
                      type="text"
                      name="reviewer_name"
                      value={reviewForm.reviewer_name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>

                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Your rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingSelect(star)}
                          className="text-2xl leading-none text-amber-500 transition hover:scale-105"
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          {star <= reviewForm.rating ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Your comment
                    </span>
                    <textarea
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Share your experience..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>

                  {submitError && (
                    <p className="text-sm text-red-700">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              </div>
            </section>
          </article>
        )}
      </div>
    </main>
  );
}

export default RestaurantDetailPage;
