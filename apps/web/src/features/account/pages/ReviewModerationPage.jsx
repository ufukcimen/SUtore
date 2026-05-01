import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, LoaderCircle, ShieldAlert, Star, XCircle } from "lucide-react";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ReviewModerationPage() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const isManager = user?.role === "product_manager";

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/manager/reviews" }, replace: true });
      return;
    }

    if (!isManager) {
      return;
    }

    let isActive = true;

    async function loadPending() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await http.get("/reviews/pending", {
          params: { manager_user_id: user.user_id },
        });

        if (!isActive) {
          return;
        }

        setReviews(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load pending reviews.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadPending();

    return () => {
      isActive = false;
    };
  }, [user, isManager, navigate]);

  async function handleAction(reviewId, newStatus) {
    if (!user || actionLoadingId) {
      return;
    }

    setActionLoadingId(reviewId);

    try {
      await http.patch(`/reviews/${reviewId}/status`, { status: newStatus }, {
        params: { manager_user_id: user.user_id },
      });

      setReviews((current) => current.filter((r) => r.review_id !== reviewId));
    } catch {
      // Silently handle — review stays in list on error
    } finally {
      setActionLoadingId(null);
    }
  }

  if (!user) {
    return null;
  }

  if (user && !isManager) {
    return (
      <StorefrontPageShell
        currentStep=""
        description=""
        eyebrow="Access denied"
        title="This area is for product managers."
      >
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-semibold">Insufficient permissions</p>
          <p className="mt-2 text-sm">Only product managers can access review moderation.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
          >
            Back to store
          </Link>
        </section>
      </StorefrontPageShell>
    );
  }

  return (
    <StorefrontPageShell
      currentStep=""
      description="Review and moderate customer comments before they appear publicly on product pages."
      eyebrow="Moderation"
      title="Pending reviews."
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <p className="text-lg font-semibold">Could not load reviews</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && reviews.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center shadow-[0_20px_60px_rgba(7,17,31,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-brand-ink">All caught up.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
            There are no pending reviews to moderate right now. New submissions will appear here automatically.
          </p>
        </section>
      ) : null}

      {!isLoading && !errorMessage && reviews.length > 0 ? (
        <div className="space-y-5">
          {reviews.map((review) => (
            <article
              key={review.review_id}
              className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(7,17,31,0.1)] sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-semibold text-brand-ink">
                      {review.user_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Product #{review.product_id}
                    </span>
                    <Link
                      to={`/products/${review.product_id}`}
                      className="text-xs font-semibold text-brand-accent hover:underline"
                    >
                      View product
                    </Link>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(review.review_id, "approved")}
                    disabled={actionLoadingId === review.review_id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(review.review_id, "rejected")}
                    disabled={actionLoadingId === review.review_id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </StorefrontPageShell>
  );
}
