import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const Route = createFileRoute("/dashboard/pembeli")({
  component: () => (
    <RoleGuard required="buyer">
      <BuyerDashboardPage />
    </RoleGuard>
  ),
});

type ProductLite = {
  id: string;
  title: string;
  images: string[] | null;
};

type OrderItemRow = {
  id: string;
  order_id?: string | null;
  product_id: string;
  quantity: number;
  price: number | string;
  products: ProductLite | ProductLite[] | null;
};

type OrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string | null;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_cost: number | string | null;
  subtotal: number | string | null;
  total: number | string | null;
  courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string | null;
  order_items: OrderItemRow[];
};

type SellerProfile = {
  id: string;
  full_name: string | null;
  shop_name: string | null;
};

type ReviewRow = {
  id: string;
  order_id: string | null;
  order_item_id: string | null;
  product_id: string;
  buyer_id: string;
  seller_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
};

type ComplaintLite = {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  description: string;
  status: string;
  seller_response: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
};

type BuyerFilter =
  | "all"
  | "active"
  | "waiting_payment"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

function BuyerDashboardPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, SellerProfile>>({});
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewRow>>({});
  const [complaintMap, setComplaintMap] = useState<
    Record<string, ComplaintLite>
  >({});
  const [activeComplaintCount, setActiveComplaintCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BuyerFilter>("all");
  const [search, setSearch] = useState("");

  const highlightedOrderId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("order") ?? "";
  }, []);

  async function loadOrders() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await db
        .from("orders")
        .select(
          `
          *,
          order_items(
            id,
            order_id,
            product_id,
            quantity,
            price,
            products(
              id,
              title,
              images
            )
          )
        `,
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const orderRows = (data ?? []) as OrderRow[];
      setOrders(orderRows);

      const sellerIds = Array.from(
        new Set(
          orderRows
            .map((order) => order.seller_id)
            .filter((sellerId): sellerId is string => Boolean(sellerId)),
        ),
      );

      if (sellerIds.length > 0) {
        const { data: sellers, error: sellerError } = await db
          .from("profiles")
          .select("id, full_name, shop_name")
          .in("id", sellerIds);

        if (sellerError) {
          console.error("[Buyer Dashboard Seller Load Error]", sellerError);
        } else {
          const nextSellerMap: Record<string, SellerProfile> = {};

          (sellers ?? []).forEach((seller: SellerProfile) => {
            nextSellerMap[seller.id] = seller;
          });

          setSellerMap(nextSellerMap);
        }
      } else {
        setSellerMap({});
      }

      const orderItemIds = orderRows
        .flatMap((order) => order.order_items ?? [])
        .map((item) => item.id)
        .filter(Boolean);

      if (orderItemIds.length > 0) {
        const { data: reviews, error: reviewsError } = await db
          .from("reviews")
          .select("*")
          .eq("buyer_id", user.id)
          .in("order_item_id", orderItemIds);

        if (reviewsError) {
          console.error("[Buyer Dashboard Reviews Load Error]", reviewsError);
          setReviewMap({});
        } else {
          const nextReviewMap: Record<string, ReviewRow> = {};

          (reviews ?? []).forEach((review: ReviewRow) => {
            if (review.order_item_id) {
              nextReviewMap[String(review.order_item_id)] = review;
            }
          });

          setReviewMap(nextReviewMap);
        }
      } else {
        setReviewMap({});
      }

      const orderIds = orderRows.map((order) => order.id).filter(Boolean);

      if (orderIds.length > 0) {
        const { data: complaints, error: complaintsError } = await db
          .from("order_complaints")
          .select("*")
          .eq("buyer_id", user.id)
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });

        if (complaintsError) {
          console.error(
            "[Buyer Dashboard Complaints Load Error]",
            complaintsError,
          );
          setComplaintMap({});
          setActiveComplaintCount(0);
        } else {
          const nextComplaintMap: Record<string, ComplaintLite> = {};

          (complaints ?? []).forEach((complaint: ComplaintLite) => {
            if (!nextComplaintMap[complaint.order_id]) {
              nextComplaintMap[complaint.order_id] = complaint;
            }
          });

          setComplaintMap(nextComplaintMap);

          setActiveComplaintCount(
            (complaints ?? []).filter((complaint: ComplaintLite) =>
              ["open", "seller_responded"].includes(
                String(complaint.status ?? ""),
              ),
            ).length,
          );
        }
      } else {
        setComplaintMap({});
        setActiveComplaintCount(0);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat pesanan.",
      );
      console.error("[Buyer Dashboard Load Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  useEffect(() => {
    if (!highlightedOrderId) return;

    setExpandedOrderId(highlightedOrderId);

    window.setTimeout(() => {
      document
        .getElementById(`buyer-order-${highlightedOrderId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 300);
  }, [highlightedOrderId, orders.length]);

  useEffect(() => {
    function handleBuyerOrderFocus(event: Event) {
      const customEvent = event as CustomEvent<{
        orderId?: string;
      }>;

      const orderId = customEvent.detail?.orderId ?? "";

      if (!orderId) return;

      setExpandedOrderId(orderId);

      window.setTimeout(() => {
        document.getElementById(`buyer-order-${orderId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 250);
    }

    window.addEventListener("revibe:buyer-order-focus", handleBuyerOrderFocus);

    return () => {
      window.removeEventListener(
        "revibe:buyer-order-focus",
        handleBuyerOrderFocus,
      );
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = db
      .channel(`buyer_orders_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          loadOrders();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          loadOrders();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_complaints",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          loadOrders();
        },
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const waitingPayment = orders.filter((order) =>
      isWaitingPayment(order),
    ).length;
    const shipped = orders.filter((order) => isShippedOrder(order)).length;
    const completed = orders.filter((order) => canReviewBuyerOrder(order)).length;
    const active = orders.filter((order) => isActiveOrder(order)).length;

    return [
      {
        label: "Total Pesanan",
        value: String(totalOrders),
        icon: ShoppingBag,
      },
      {
        label: "Menunggu Bayar",
        value: String(waitingPayment),
        icon: CreditCard,
      },
      {
        label: "Sedang Dikirim",
        value: String(shipped),
        icon: Truck,
      },
      {
        label: "Selesai",
        value: String(completed),
        icon: CheckCircle2,
      },
      {
        label: "Pesanan Aktif",
        value: String(active),
        icon: Clock,
      },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchFilter = filterBuyerOrder(order, filter);

      if (!matchFilter) return false;

      const keyword = search.trim().toLowerCase();

      if (!keyword) return true;

      const seller = order.seller_id ? sellerMap[order.seller_id] : null;
      const complaint = complaintMap[order.id];

      const haystack = [
        order.id,
        order.order_status,
        order.payment_status,
        order.payment_method,
        order.shipping_method,
        order.shipping_address,
        order.courier,
        order.tracking_number,
        seller?.shop_name,
        seller?.full_name,
        complaint ? "ada komplain" : "",
        complaint?.reason,
        complaint?.description,
        complaint?.status,
        ...(order.order_items ?? []).map((item) => {
          const product = getOrderItemProduct(item);
          const review = reviewMap[item.id];

          return [
            product?.title ?? "",
            review ? "sudah diulas" : "belum diulas",
            review?.rating ? `rating ${review.rating}` : "",
          ].join(" ");
        }),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [orders, filter, search, sellerMap, reviewMap, complaintMap]);

  async function handleCancelOrder(order: OrderRow) {
    if (!user?.id) return;

    if (!canCancelBuyerOrder(order)) {
      toast.error("Pesanan ini tidak bisa dibatalkan.");
      return;
    }

    const confirmed = window.confirm(
      "Batalkan pesanan ini? Stok produk akan dikembalikan.",
    );

    if (!confirmed) return;

    setUpdatingId(order.id);

    try {
      const { error } = await db
        .from("orders")
        .update({
          order_status: "dibatalkan",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("buyer_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      await restoreStockForCancelledOrder(order);

      toast.success("Pesanan berhasil dibatalkan.");
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membatalkan pesanan.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmReceived(order: OrderRow) {
    if (!user?.id) return;

    if (!canConfirmReceived(order)) {
      toast.error("Pesanan belum bisa dikonfirmasi diterima.");
      return;
    }

    const confirmed = window.confirm(
      "Konfirmasi pesanan sudah diterima? Setelah ini kamu bisa memberi ulasan produk.",
    );

    if (!confirmed) return;

    setUpdatingId(order.id);

    try {
      const { error } = await db
        .from("orders")
        .update({
          order_status: "selesai",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("buyer_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Pesanan selesai. Kamu sekarang bisa memberi ulasan.");
      await loadOrders();

      window.setTimeout(() => {
        document.getElementById(`buyer-order-${order.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengonfirmasi pesanan.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">Dashboard Pembeli</h1>

              <p className="mt-2 text-muted-foreground">
                Silakan login sebagai pembeli untuk melihat pesanan.
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
              <h1 className="text-3xl font-bold">Dashboard Pembeli</h1>

              <p className="mt-1 text-muted-foreground">
                Pantau pembayaran, pengiriman, nomor resi, pembatalan, konfirmasi
                pesanan diterima, ulasan, dan komplain.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadOrders}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>

              <Button asChild className="gradient-brand text-white">
                <a href="/produk">Belanja Lagi</a>
              </Button>

              <Button asChild variant="outline">
                <a href="/invoice">Invoice Saya</a>
              </Button>

              <Button asChild variant="outline">
                <a href="/ulasan">
                  <Star className="mr-2 h-4 w-4" />
                  Ulasan Saya
                </a>
              </Button>

              <Button asChild variant="outline">
                <a href="/komplain">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Komplain
                  {activeComplaintCount > 0 ? ` (${activeComplaintCount})` : ""}
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={<stat.icon className="h-6 w-6 text-primary" />}
              />
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Pesanan Saya</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pesanan yang dibuat dari checkout. Jika order bermasalah,
                  gunakan tombol komplain pada pesanan yang sudah dikirim atau selesai.
                </p>
              </div>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as BuyerFilter)
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Semua Pesanan</option>
                <option value="active">Pesanan Aktif</option>
                <option value="waiting_payment">Menunggu Bayar</option>
                <option value="processing">Diproses Seller</option>
                <option value="shipped">Dikirim</option>
                <option value="completed">Selesai/Diterima</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="relative mt-5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari order ID, seller, produk, kurir, resi, ulasan, komplain..."
                className="pl-9"
              />
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <EmptyOrders />
              ) : (
                <div className="space-y-5">
                  {filteredOrders.map((order) => (
                    <BuyerOrderCard
                      key={order.id}
                      order={order}
                      seller={
                        order.seller_id ? sellerMap[order.seller_id] : null
                      }
                      reviewMap={reviewMap}
                      complaint={complaintMap[order.id] ?? null}
                      highlighted={highlightedOrderId === order.id}
                      expanded={expandedOrderId === order.id}
                      updating={updatingId === order.id}
                      onToggleExpanded={() =>
                        setExpandedOrderId((current) =>
                          current === order.id ? null : order.id,
                        )
                      }
                      onCancel={() => handleCancelOrder(order)}
                      onConfirmReceived={() => handleConfirmReceived(order)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function BuyerOrderCard({
  order,
  seller,
  reviewMap,
  complaint,
  highlighted,
  expanded,
  updating,
  onToggleExpanded,
  onCancel,
  onConfirmReceived,
}: {
  order: OrderRow;
  seller: SellerProfile | null;
  reviewMap: Record<string, ReviewRow>;
  complaint: ComplaintLite | null;
  highlighted: boolean;
  expanded: boolean;
  updating: boolean;
  onToggleExpanded: () => void;
  onCancel: () => void;
  onConfirmReceived: () => void;
}) {
  const reviewable = canReviewBuyerOrder(order);
  const canCancel = canCancelBuyerOrder(order);
  const canConfirm = canConfirmReceived(order);
  const shipped = isShippedOrder(order);
  const itemCount = order.order_items?.length ?? 0;
  const reviewedCount = (order.order_items ?? []).filter(
    (item) => reviewMap[item.id],
  ).length;

  return (
    <article
      id={`buyer-order-${order.id}`}
      className={`rounded-2xl border bg-background p-5 transition ${highlighted
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
        }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Order ID</div>

          <div className="font-mono text-sm font-semibold">{order.id}</div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Store className="h-4 w-4 text-primary" />

            <span className="text-sm text-muted-foreground">Seller:</span>

            <span className="font-semibold">
              {seller?.shop_name || seller?.full_name || "Seller"}
            </span>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Dibuat: {new Date(order.created_at).toLocaleString("id-ID")}
          </div>

          {reviewable ? (
            <div className="mt-2 text-xs text-muted-foreground">
              Ulasan: {reviewedCount}/{itemCount} produk sudah diulas
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <span className={orderStatusClass(order.order_status)}>
            {orderStatusLabel(order.order_status)}
          </span>

          <span className={paymentStatusClass(order.payment_status)}>
            {paymentStatusLabel(order.payment_status)}
          </span>

          {complaint ? (
            <span className={buyerComplaintStatusClass(complaint.status)}>
              Ada Komplain
            </span>
          ) : null}
        </div>
      </div>

      <div className="my-5 border-t border-border" />

      <div className="space-y-4">
        {(order.order_items ?? []).map((item) => (
          <BuyerOrderItem
            key={item.id}
            order={order}
            item={item}
            reviewable={reviewable}
            existingReview={reviewMap[item.id] ?? null}
          />
        ))}
      </div>

      <div className="my-5 border-t border-border" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Info
            label="Metode Pembayaran"
            value={paymentMethodLabel(order.payment_method)}
          />
          <Info
            label="Ongkir"
            value={formatIDR(Number(order.shipping_cost ?? 0))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Info
            label="Metode Pengiriman"
            value={order.shipping_method || "-"}
          />
          <Info
            label="Total Order"
            value={formatIDR(getOrderTotal(order))}
            strong
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-green-100 p-4 text-green-950">
        <div className="flex items-center gap-2 font-semibold">
          <MapPin className="h-4 w-4" />
          Alamat Pengiriman
        </div>

        <div className="mt-2 text-sm text-green-900">
          {order.shipping_address || "-"}
        </div>
      </div>

      {shipped || order.tracking_number ? (
        <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-purple-950">
          <div className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4" />
            Detail Pengiriman
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Info label="Jasa Kirim" value={order.courier || "-"} />
            <Info label="Nomor Resi" value={order.tracking_number || "-"} />
            <Info
              label="Tanggal Kirim"
              value={
                order.shipped_at
                  ? new Date(order.shipped_at).toLocaleString("id-ID")
                  : "-"
              }
            />
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold">Detail Pesanan</h3>

          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <Info
              label="Subtotal"
              value={formatIDR(Number(order.subtotal ?? 0))}
            />
            <Info label="Total Produk" value={`${itemCount} item`} />
            <Info
              label="Status Order"
              value={orderStatusLabel(order.order_status)}
            />
            <Info
              label="Status Pembayaran"
              value={paymentStatusLabel(order.payment_status)}
            />
          </div>

          {reviewable ? (
            <div className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">
              Pesanan ini sudah selesai. Status ulasan: {reviewedCount}/
              {itemCount} produk sudah diulas.
            </div>
          ) : null}

          {complaint ? (
            <div className="mt-4 rounded-xl bg-yellow-100 p-4 text-sm text-yellow-800">
              Pesanan ini memiliki komplain aktif/riwayat komplain.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onToggleExpanded}>
          {expanded ? "Tutup Detail" : "Lihat Detail"}
        </Button>

        <Button asChild variant="outline">
          <a href={`/invoice?order=${order.id}`}>Invoice</a>
        </Button>

        {canCancel ? (
          <Button
            type="button"
            variant="destructive"
            disabled={updating}
            onClick={onCancel}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Batalkan Pesanan
          </Button>
        ) : null}

        {canConfirm ? (
          <Button
            type="button"
            disabled={updating}
            onClick={onConfirmReceived}
            className="gradient-brand text-white"
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="mr-2 h-4 w-4" />
            )}
            Pesanan Diterima
          </Button>
        ) : null}

        {reviewable ? (
          <Button asChild variant="outline">
            <a href="/ulasan">
              <Star className="mr-2 h-4 w-4" />
              Lihat Semua Ulasan
            </a>
          </Button>
        ) : null}

        {canOpenComplaintShortcut(order) ? (
          complaint ? (
            <Button asChild variant="outline">
              <a href={`/komplain?complaint=${complaint.id}`}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Lihat Komplain
              </a>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <a href={`/komplain?order=${order.id}`}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Buat Komplain
              </a>
            </Button>
          )
        ) : null}
      </div>
    </article>
  );
}

function BuyerOrderItem({
  order,
  item,
  reviewable,
  existingReview,
}: {
  order: OrderRow;
  item: OrderItemRow;
  reviewable: boolean;
  existingReview: ReviewRow | null;
}) {
  const product = getOrderItemProduct(item);
  const image = product?.images?.[0] ?? "";
  const title = product?.title ?? "Produk";
  const itemTotal = Number(item.price ?? 0) * Number(item.quantity ?? 0);

  return (
    <div className="flex gap-4">
      <a
        href={`/detail-produk?id=${item.product_id}`}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}
      </a>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <a
              href={`/detail-produk?id=${item.product_id}`}
              className="line-clamp-2 font-semibold hover:text-primary"
            >
              {title}
            </a>

            {existingReview ? (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <Star className="h-3.5 w-3.5 fill-current" />
                Sudah Diulas Â· {existingReview.rating}/5
              </div>
            ) : reviewable ? (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                <Star className="h-3.5 w-3.5" />
                Belum Diulas
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-1 text-sm text-muted-foreground">
          {item.quantity}x {formatIDR(Number(item.price))}
        </div>

        <div className="mt-1 font-semibold">{formatIDR(itemTotal)}</div>

        {reviewable ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={`/ulasan?order=${order.id}&product=${item.product_id}&item=${item.id}`}
              >
                <Star className="mr-2 h-4 w-4" />
                {existingReview ? "Edit Ulasan" : "Beri Ulasan"}
              </a>
            </Button>

            <Button asChild variant="ghost" size="sm">
              <a href={`/detail-produk?id=${item.product_id}`}>
                Lihat Produk
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {icon}

      <div className="mt-4 text-2xl font-bold">{value}</div>

      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Info({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | null;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>

      <div className={strong ? "text-lg font-bold text-primary" : "font-medium"}>
        {value || "-"}
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Package className="mx-auto h-10 w-10 text-primary" />

      <h3 className="mt-4 text-lg font-semibold">Belum ada pesanan</h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Pesanan akan muncul di sini setelah kamu menyelesaikan checkout.
      </p>

      <Button asChild className="mt-6 gradient-brand text-white">
        <a href="/produk">Mulai Belanja</a>
      </Button>
    </div>
  );
}

async function restoreStockForCancelledOrder(order: OrderRow) {
  const items = order.order_items ?? [];

  for (const item of items) {
    const productId = item.product_id;
    const quantity = Number(item.quantity ?? 0);

    if (!productId || quantity <= 0) continue;

    const { data: productData, error: productError } = await db
      .from("products")
      .select("id, stock")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !productData) {
      console.error("[Restore Stock Read Error]", productError);
      continue;
    }

    const currentStock = Number(productData.stock ?? 0);
    const nextStock = currentStock + quantity;

    const { error: updateError } = await db
      .from("products")
      .update({
        stock: nextStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error("[Restore Stock Update Error]", updateError);
    }
  }
}

function getOrderItemProduct(item: OrderItemRow) {
  if (Array.isArray(item.products)) {
    return item.products[0] ?? null;
  }

  return item.products ?? null;
}

function getOrderTotal(order: OrderRow) {
  return Number(order.total ?? 0);
}

function filterBuyerOrder(order: OrderRow, filter: BuyerFilter) {
  if (filter === "all") return true;

  if (filter === "active") return isActiveOrder(order);

  if (filter === "waiting_payment") return isWaitingPayment(order);

  if (filter === "processing") return isProcessingOrder(order);

  if (filter === "shipped") return isShippedOrder(order);

  if (filter === "completed") return canReviewBuyerOrder(order);

  if (filter === "cancelled") return isCancelledOrder(order);

  return true;
}

function canReviewBuyerOrder(order: {
  order_status?: string | null;
  payment_status?: string | null;
}) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);

  const isOrderFinished =
    orderStatus === "selesai" ||
    orderStatus === "pesanan_diterima" ||
    orderStatus === "diterima" ||
    orderStatus === "completed" ||
    orderStatus === "delivered";

  const isPaid =
    paymentStatus === "dibayar" ||
    paymentStatus === "paid" ||
    paymentStatus === "settlement" ||
    paymentStatus === "success";

  return isOrderFinished && isPaid;
}

function canOpenComplaintShortcut(order: {
  order_status?: string | null;
  payment_status?: string | null;
}) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);

  const paid =
    paymentStatus === "dibayar" ||
    paymentStatus === "paid" ||
    paymentStatus === "settlement" ||
    paymentStatus === "success";

  const complaintAllowed =
    orderStatus === "dikirim" ||
    orderStatus === "shipped" ||
    orderStatus === "selesai" ||
    orderStatus === "pesanan_diterima" ||
    orderStatus === "completed" ||
    orderStatus === "delivered";

  return paid && complaintAllowed;
}

function canConfirmReceived(order: OrderRow) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);

  const paid =
    paymentStatus === "dibayar" ||
    paymentStatus === "paid" ||
    paymentStatus === "settlement" ||
    paymentStatus === "success";

  const shipped =
    orderStatus === "dikirim" ||
    orderStatus === "shipped" ||
    orderStatus === "delivered";

  return paid && shipped && !canReviewBuyerOrder(order);
}

function canCancelBuyerOrder(order: OrderRow) {
  const orderStatus = normalizeStatus(order.order_status);

  if (isCancelledOrder(order)) return false;
  if (canReviewBuyerOrder(order)) return false;
  if (isShippedOrder(order)) return false;
  if (order.tracking_number) return false;

  return [
    "menunggu_pembayaran",
    "menunggu_konfirmasi_penjual",
    "menunggu_konfirmasi",
    "diproses_penjual",
    "diproses",
    "pending",
    "processing",
  ].includes(orderStatus);
}

function isWaitingPayment(order: OrderRow) {
  const paymentStatus = normalizeStatus(order.payment_status);
  const orderStatus = normalizeStatus(order.order_status);

  return (
    paymentStatus === "menunggu_pembayaran" ||
    paymentStatus === "pending" ||
    orderStatus === "menunggu_pembayaran"
  );
}

function isProcessingOrder(order: OrderRow) {
  const orderStatus = normalizeStatus(order.order_status);

  return [
    "menunggu_konfirmasi_penjual",
    "menunggu_konfirmasi",
    "diproses_penjual",
    "diproses",
    "processing",
  ].includes(orderStatus);
}

function isShippedOrder(order: OrderRow) {
  const orderStatus = normalizeStatus(order.order_status);

  return (
    orderStatus === "dikirim" ||
    orderStatus === "shipped" ||
    Boolean(order.tracking_number)
  );
}

function isCancelledOrder(order: OrderRow) {
  const orderStatus = normalizeStatus(order.order_status);

  return orderStatus === "dibatalkan" || orderStatus === "cancelled";
}

function isActiveOrder(order: OrderRow) {
  if (isCancelledOrder(order)) return false;
  if (canReviewBuyerOrder(order)) return false;

  return true;
}

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function orderStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    diproses_penjual: "Diproses Penjual",
    diproses: "Diproses",
    dikirim: "Dikirim",
    shipped: "Dikirim",
    delivered: "Diterima",
    pesanan_diterima: "Pesanan Diterima",
    diterima: "Diterima",
    selesai: "Selesai",
    completed: "Selesai",
    dibatalkan: "Dibatalkan",
    cancelled: "Dibatalkan",
  };

  return labels[normalizeStatus(status)] ?? status ?? "-";
}

function paymentStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    pending: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    paid: "Dibayar",
    settlement: "Dibayar",
    success: "Dibayar",
    gagal: "Gagal",
    failed: "Gagal",
    dikembalikan: "Dikembalikan",
    refunded: "Dikembalikan",
  };

  return labels[normalizeStatus(status)] ?? status ?? "-";
}

function paymentMethodLabel(method: string | null) {
  const labels: Record<string, string> = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    bank_transfer: "Transfer Bank",
    qris: "QRIS",
  };

  return labels[normalizeStatus(method)] ?? method ?? "-";
}

function orderStatusClass(status: string | null) {
  const safeStatus = normalizeStatus(status);

  if (
    safeStatus === "selesai" ||
    safeStatus === "pesanan_diterima" ||
    safeStatus === "diterima" ||
    safeStatus === "completed" ||
    safeStatus === "delivered"
  ) {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }

  if (safeStatus === "dikirim" || safeStatus === "shipped") {
    return "rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700";
  }

  if (safeStatus === "dibatalkan" || safeStatus === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }

  if (safeStatus === "diproses_penjual" || safeStatus === "diproses") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }

  return "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary";
}

function paymentStatusClass(status: string | null) {
  const safeStatus = normalizeStatus(status);

  if (
    safeStatus === "dibayar" ||
    safeStatus === "paid" ||
    safeStatus === "settlement" ||
    safeStatus === "success"
  ) {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }

  if (safeStatus === "gagal" || safeStatus === "failed") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }

  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
}

function buyerComplaintStatusClass(status: string | null) {
  const safeStatus = normalizeStatus(status);

  if (safeStatus === "resolved") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }

  if (safeStatus === "seller_responded") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }

  if (safeStatus === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }

  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
}

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
