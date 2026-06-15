import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Loader2,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Star,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  getReviewContext,
  getReviewableItems,
  saveProductReview,
  type ReviewContext,
  type ReviewableItem,
} from "@/lib/reviews";

export const Route = createFileRoute("/ulasan")({
  component: ReviewPage,
});

function ReviewPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [context, setContext] = useState<ReviewContext | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const searchParams = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        orderId: "",
        productId: "",
        orderItemId: "",
      };
    }

    const params = new URLSearchParams(window.location.search);

    return {
      orderId: params.get("order") ?? "",
      productId: params.get("product") ?? "",
      orderItemId: params.get("item") ?? "",
    };
  }, []);

  const isFormMode = Boolean(searchParams.orderId && searchParams.productId);

  async function loadReviewPage() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (isFormMode) {
        const reviewContext = await getReviewContext({
          buyerId: user.id,
          orderId: searchParams.orderId,
          productId: searchParams.productId,
          orderItemId: searchParams.orderItemId,
        });

        setContext(reviewContext);

        if (reviewContext.existingReview) {
          setRating(reviewContext.existingReview.rating);
          setComment(reviewContext.existingReview.comment ?? "");
        } else {
          setRating(5);
          setComment("");
        }

        setItems([]);
      } else {
        const rows = await getReviewableItems(user.id);
        setItems(rows);
        setContext(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat halaman ulasan.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviewPage();
  }, [user?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli.");
      return;
    }

    if (!context) {
      toast.error("Data ulasan tidak valid.");
      return;
    }

    setSaving(true);

    try {
      await saveProductReview({
        buyerId: user.id,
        orderId: context.orderId,
        orderItemId: context.orderItemId,
        productId: context.productId,
        sellerId: context.sellerId,
        rating,
        comment,
      });

      toast.success("Ulasan berhasil disimpan.");
      window.location.href = `/detail-produk?id=${context.productId}`;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan ulasan.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <MessageSquareText className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">Ulasan Produk</h1>

              <p className="mt-2 text-muted-foreground">
                Silakan login sebagai pembeli untuk memberi ulasan.
              </p>

              <Button asChild className="mt-6 gradient-brand text-white">
                <a href="/login/pembeli">Login Pembeli</a>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Ulasan Produk</h1>

              <p className="mt-1 text-muted-foreground">
                Berikan rating setelah pesanan diterima atau selesai.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={loadReviewPage}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : isFormMode ? (
            context ? (
              <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="overflow-hidden rounded-2xl bg-muted">
                    {context.productImage ? (
                      <img
                        src={context.productImage}
                        alt={context.productTitle}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-muted-foreground">
                        Tidak ada foto
                      </div>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-semibold">
                    {context.productTitle}
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Order ID: {context.orderId}
                  </p>

                  <div className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">
                    Status pesanan sudah bisa diulas:{" "}
                    <b>{orderStatusLabel(context.orderStatus)}</b>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <h2 className="text-xl font-semibold">
                    {context.existingReview ? "Edit Ulasan" : "Beri Ulasan"}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Rating akan tampil di halaman detail produk dan kartu produk.
                  </p>

                  <div className="mt-6">
                    <div className="font-medium">Rating Produk</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`rounded-xl border px-4 py-3 transition ${rating >= value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground"
                            }`}
                        >
                          <Star
                            className={`h-6 w-6 ${rating >= value ? "fill-current" : ""
                              }`}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      Rating dipilih: {rating} dari 5
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="font-medium">Komentar Ulasan</label>

                    <Textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={6}
                      placeholder="Tulis pengalaman kamu terhadap produk ini."
                      className="mt-3"
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" asChild>
                      <a href="/ulasan">Kembali</a>
                    </Button>

                    <Button
                      type="submit"
                      disabled={saving}
                      className="gradient-brand text-white"
                    >
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquareText className="mr-2 h-4 w-4" />
                      )}
                      Simpan Ulasan
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <EmptyState
                title="Data ulasan tidak ditemukan"
                description="Pastikan pesanan sudah diterima/selesai dan produk ada dalam pesanan."
              />
            )
          ) : (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">
                Produk yang Bisa Diulas
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Produk dari pesanan yang sudah diterima atau selesai akan muncul
                di sini.
              </p>

              <div className="mt-6">
                {items.length === 0 ? (
                  <EmptyState
                    title="Belum ada produk yang bisa diulas"
                    description="Pastikan pesanan sudah kamu tandai diterima atau statusnya sudah selesai."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                      <ReviewableItemCard key={item.orderItemId} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ReviewableItemCard({ item }: { item: ReviewableItem }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          {item.productImage ? (
            <img
              src={item.productImage}
              alt={item.productTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold">{item.productTitle}</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Order: {item.orderId}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Status: {orderStatusLabel(item.orderStatus)}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Jumlah: {item.quantity}
          </p>

          {item.existingReview ? (
            <div className="mt-2 flex items-center gap-1 text-sm text-primary">
              <Star className="h-4 w-4 fill-current" />
              {item.existingReview.rating}/5 — Sudah diulas
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              Belum diulas
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button asChild className="gradient-brand text-white">
          <a
            href={`/ulasan?order=${item.orderId}&product=${item.productId}&item=${item.orderItemId}`}
          >
            {item.existingReview ? "Edit Ulasan" : "Beri Ulasan"}
          </a>
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <PackageCheck className="mx-auto h-10 w-10 text-primary" />

      <h3 className="mt-4 text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <Button asChild className="mt-6 gradient-brand text-white">
        <a href="/dashboard/pembeli">Kembali ke Dashboard Pembeli</a>
      </Button>
    </div>
  );
}

function orderStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    selesai: "Selesai",
    pesanan_diterima: "Pesanan Diterima",
    diterima: "Diterima",
    completed: "Selesai",
    delivered: "Diterima",
    dikirim: "Dikirim",
    diproses_penjual: "Diproses Penjual",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    dibatalkan: "Dibatalkan",
  };

  return labels[String(status ?? "")] ?? status ?? "-";
}