import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import {
    getProductReviews,
    getProductReviewSummary,
    type ReviewRow,
} from "@/lib/reviews";

export function ProductRatingInline({
    productId,
    averageRating,
    reviewCount,
}: {
    productId: string;
    averageRating?: number | string | null;
    reviewCount?: number | string | null;
}) {
    const [summary, setSummary] = useState({
        averageRating: Number(averageRating ?? 0),
        reviewCount: Number(reviewCount ?? 0),
    });

    useEffect(() => {
        let active = true;

        async function loadSummary() {
            if (!productId) return;

            const result = await getProductReviewSummary(productId);

            if (active) {
                setSummary(result);
            }
        }

        loadSummary();

        return () => {
            active = false;
        };
    }, [productId]);

    const safeAverage = Number(summary.averageRating ?? 0);
    const safeCount = Number(summary.reviewCount ?? 0);
    const roundedAverage = Math.round(safeAverage);

    if (safeCount <= 0) {
        return (
            <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4" />
                ))}
                <span className="ml-1">Belum ada ulasan</span>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-1 text-sm">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= roundedAverage
                            ? "fill-current text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                />
            ))}

            <span className="ml-1 text-muted-foreground">
                {safeAverage.toFixed(1)} ({safeCount} ulasan)
            </span>
        </div>
    );
}

export function StaticRating({ rating }: { rating: number }) {
    const safeRating = Math.max(0, Math.min(5, Number(rating ?? 0)));

    return (
        <div className="flex items-center gap-1 text-sm">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= safeRating
                            ? "fill-current text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                />
            ))}

            <span className="ml-1 text-muted-foreground">
                {safeRating.toFixed(0)}/5
            </span>
        </div>
    );
}

export function ProductReviewSection({ productId }: { productId: string }) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        averageRating: 0,
        reviewCount: 0,
    });
    const [reviews, setReviews] = useState<ReviewRow[]>([]);

    useEffect(() => {
        let active = true;

        async function loadReviews() {
            if (!productId) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const [summaryResult, reviewRows] = await Promise.all([
                    getProductReviewSummary(productId),
                    getProductReviews(productId),
                ]);

                if (!active) return;

                setSummary(summaryResult);
                setReviews(reviewRows);
            } catch (error) {
                console.error("[Product Review Section Error]", error);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadReviews();

        return () => {
            active = false;
        };
    }, [productId]);

    return (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Ulasan Produk</h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Rating dan komentar dari pembeli yang sudah menyelesaikan pesanan.
                    </p>
                </div>

                <div className="rounded-2xl bg-primary/10 px-4 py-3 text-primary">
                    <div className="text-2xl font-bold">
                        {Number(summary.averageRating ?? 0).toFixed(1)}
                    </div>

                    <div className="text-xs">{summary.reviewCount} ulasan</div>
                </div>
            </div>

            <div className="mt-4">
                <ProductRatingInline
                    productId={productId}
                    averageRating={summary.averageRating}
                    reviewCount={summary.reviewCount}
                />
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        Memuat ulasan...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        Produk ini belum memiliki ulasan.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="rounded-xl border border-border bg-background p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <StaticRating rating={review.rating} />

                                    <div className="text-xs text-muted-foreground">
                                        {new Date(review.created_at).toLocaleString("id-ID")}
                                    </div>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                    {review.comment || "Pembeli tidak menulis komentar."}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}