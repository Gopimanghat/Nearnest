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
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/restaurants/${id}`
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
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/restaurants/${id}/reviews`
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
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/reviews/${id}/summary`
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/restaurants/${id}/reviews`,
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
    <main className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          ← Back to Home
        </Link>

        {isLoading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
              <span className="text-base font-medium tracking-wide">
                Loading restaurant details...
              </span>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && details && (
          <article className="animate-[fade-in_0.5s_ease-out_both] rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-10">
            <header className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 inline-block border-b-4 border-orange-500 pb-2 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {details.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-2">
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 font-medium text-emerald-800">
                  {details.cuisine}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">{details.area}</span>
              </div>
            </header>

            <p className="mb-10 text-lg leading-relaxed text-slate-600">{details.description}</p>

            {/* Info Grid */}
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-10">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-2xl">
                  <span role="img" aria-label="clock">🕐</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Opening Hours
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {details.openingTime} - {details.closingTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-2xl">
                  <span role="img" aria-label="money">💰</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Price Range
                  </p>
                  <p className="mt-1 font-medium text-slate-800">{details.priceRange}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-2xl">
                  <span role="img" aria-label="star">⭐</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Average Rating
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-amber-400 text-lg">
                      {getStarRating(details.rating)}
                    </span>
                    <span className="font-bold text-slate-800">{details.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-2xl">
                  <span role="img" aria-label="pin">📍</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Location Area
                  </p>
                  <p className="mt-1 font-medium text-slate-800">{details.area}</p>
                </div>
              </div>
            </section>

            {/* Actions Grid */}
            <section className="mb-12 flex flex-col gap-4 sm:flex-row">
              {details.phoneHref ? (
                <a
                  href={details.phoneHref}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3.5 text-base font-bold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <span role="img" aria-label="phone">📞</span> Call {details.phone}
                </a>
              ) : (
                <span className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-100 bg-slate-50 px-6 py-3.5 text-base text-slate-400 shadow-inner">
                  Phone not available
                </span>
              )}

              {details.whatsappHref ? (
                <a
                  href={details.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.85 5.176 2.457 7.288L.552 24l4.81-1.895C7.406 23.518 9.68 24.062 12.03 24.062c6.646 0 12.03-5.384 12.03-12.031S18.677 0 12.031 0zm0 22.031c-2.228 0-4.407-.597-6.289-1.72l-.448-.266L2.44 21.16l1.127-2.775-.292-.464A9.99 9.99 0 0 1 1.745 12.03c0-5.541 4.505-10.046 10.286-10.046 5.541 0 10.046 4.505 10.046 10.046s-4.505 10.046-10.046 10.046zM17.65 15.3c-.309-.155-1.826-.902-2.108-1.005-.282-.103-.49-.155-.694.155-.205.309-.792 1.005-.972 1.21-.18.206-.358.232-.667.078C12.9 15.584 11.666 15 10.655 13.785c-.786-.94-.85-1.229-.448-1.636.182-.185.412-.464.619-.696.206-.232.274-.386.412-.644.137-.258.069-.49-.009-.644-.078-.155-.694-1.67-.951-2.288-.25-.6-.503-.518-.694-.528-.18-.01-.387-.01-.594-.01-.206 0-.543.078-.826.387-.283.309-1.082 1.056-1.082 2.576 0 1.52 1.108 2.988 1.262 3.195.155.206 2.181 3.328 5.283 4.667 2.13 1.006 2.871.936 3.424.792.65-.17 1.825-.747 2.083-1.468.258-.721.258-1.34.18-1.468-.078-.129-.283-.206-.593-.36z"/></svg>
                  Chat on WhatsApp
                </a>
              ) : (
                <span className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-100 bg-slate-50 px-6 py-3.5 text-base text-slate-400 shadow-inner">
                  WhatsApp not available
                </span>
              )}
            </section>

            <section className="mt-12 border-t border-slate-200 pt-10">
              {aiSummary && (
                <div className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-orange-900 flex items-center gap-2">
                    <span role="img" aria-label="robot" className="text-2xl">🤖</span> AI Review Summary
                  </h2>
                  <ul className="mt-4 list-none space-y-3 pl-1 text-base leading-relaxed text-orange-800 italic">
                    {aiSummary
                      .split("\n")
                      .map((line) => line.trim())
                      .filter((line) => line)
                      .map((line, index) => (
                        <li key={`${line}-${index}`} className="flex items-start gap-2">
                          <span className="text-orange-400 mt-1">✦</span>
                          <span>{line.replace(/^[-*•]\s*/, "")}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <h2 className="text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                Guest Reviews
              </h2>

              {reviewsLoading && (
                <div className="mt-4 flex items-center gap-3 text-slate-500">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
                  <span className="text-base">Loading reviews...</span>
                </div>
              )}

              {!reviewsLoading && reviewsError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {reviewsError}
                </div>
              )}

              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  No reviews yet, be the first to share your experience!
                </p>
              )}

              {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="relative mt-8 pl-4 sm:pl-6 space-y-8 before:absolute before:inset-y-0 before:left-[11px] sm:before:left-[19px] before:w-[2px] before:bg-slate-100">
                  {reviews.map((review, index) => (
                    <article
                      key={review.id || `${review.reviewer_name}-${index}`}
                      className="relative pl-6 sm:pl-8"
                    >
                      <span className="absolute left-[-5px] sm:left-[-5px] top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white ring-[3px] ring-orange-500"></span>
                      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <h3 className="text-lg font-bold text-slate-800">
                            {review.reviewer_name || "Anonymous"}
                          </h3>
                          <p className="text-sm font-medium text-slate-400">
                            {formatReviewDate(review.created_at)}
                          </p>
                        </div>
                        <div className="mb-3 text-lg tracking-widest text-amber-400">
                          {getStarRating(review.rating)}
                        </div>
                        <p className="text-base leading-relaxed text-slate-600">
                          {review.comment || "No comment provided."}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Review Form */}
              <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Add your rating
                </h3>

                <form className="space-y-6" onSubmit={handleReviewSubmit}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Your Name
                    </span>
                    <input
                      type="text"
                      name="reviewer_name"
                      value={reviewForm.reviewer_name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>

                  <div>
                    <p className="mb-2 block text-sm font-bold text-slate-700">Overall Rating</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingSelect(star)}
                          className={`text-3xl leading-none transition-transform hover:scale-110 focus:outline-none ${star <= reviewForm.rating ? 'text-amber-400' : 'text-slate-300'}`}
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                      {reviewForm.rating > 0 && <span className="ml-3 text-sm font-bold text-slate-500">({reviewForm.rating}/5)</span>}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Your Details
                    </span>
                    <textarea
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="What was good? What could be better? Share your experience with others..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>

                  {submitError && (
                    <p className="text-sm font-semibold text-red-600">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex justify-center rounded-xl bg-orange-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            </section>
          </article>
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

export default RestaurantDetailPage;
