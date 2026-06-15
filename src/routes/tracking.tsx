import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const Route = createFileRoute("/tracking")({
  component: TrackingPage,
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
  order_status: string | null;
  payment_status: string | null;
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

type ProfileRow = {
  id: string;
  full_name: string | null;
  shop_name: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
};

function TrackingPage() {
  const { user, roles } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileRow>>({});
  const [selectedOrderId, setSelectedOrderId] = useState(readOrderIdFromUrl());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = (roles ?? []).includes("admin");
  const isSeller = (roles ?? []).includes("seller");
  const isBuyer = (roles ?? []).includes("buyer");

  async function loadTrackingData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = db
        .from("orders")
        .select(
          `
          id,
          buyer_id,
          seller_id,
          order_status,
          payment_status,
          payment_method,
          shipping_method,
          shipping_address,
          shipping_cost,
          subtotal,
          total,
          courier,
          tracking_number,
          shipped_at,
          created_at,
          updated_at,
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
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const rows = (data ?? []) as OrderRow[];
      setOrders(rows);

      const profileIds = Array.from(
        new Set(
          rows
            .flatMap((order) => [order.buyer_id, order.seller_id])
            .filter((id): id is string => Boolean(id)),
        ),
      );

      if (profileIds.length > 0) {
        const { data: profiles, error: profileError } = await db
          .from("profiles")
          .select("id, full_name, shop_name, whatsapp, address, city")
          .in("id", profileIds);

        if (profileError) {
          console.error("[Tracking Profile Load Error]", profileError);
          setProfileMap({});
        } else {
          const nextMap: Record<string, ProfileRow> = {};

          (profiles ?? []).forEach((profile: ProfileRow) => {
            nextMap[profile.id] = profile;
          });

          setProfileMap(nextMap);
        }
      } else {
        setProfileMap({});
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat tracking.",
      );
      console.error("[Tracking Load Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrackingData();
  }, [user?.id, isAdmin]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter((order) => {
      const buyer = profileMap[order.buyer_id];
      const seller = order.seller_id ? profileMap[order.seller_id] : null;

      const productText = (order.order_items ?? [])
        .map((item) => getOrderItemProduct(item)?.title ?? "")
        .join(" ");

      const haystack = [
        order.id,
        order.order_status,
        order.payment_status,
        order.payment_method,
        order.shipping_method,
        order.shipping_address,
        order.courier,
        order.tracking_number,
        buyer?.full_name,
        buyer?.shop_name,
        seller?.full_name,
        seller?.shop_name,
        productText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [orders, search, profileMap]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;

    return orders.find((order) => order.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);

  function openTracking(orderId: string) {
    setSelectedOrderId(orderId);
    window.history.pushState(null, "", `/tracking?order=${orderId}`);

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  }

  function closeTracking() {
    setSelectedOrderId("");
    window.history.pushState(null, "", "/tracking");
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <Truck className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">Tracking Pesanan</h1>

              <p className="mt-2 text-muted-foreground">
                Silakan login untuk melacak pengiriman pesanan.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild className="gradient-brand text-white">
                  <a href="/login/pembeli">Login Pembeli</a>
                </Button>

                <Button asChild variant="outline">
                  <a href="/login/penjual">Login Penjual</a>
                </Button>
              </div>
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
              <h1 className="text-3xl font-bold">Tracking Pesanan</h1>

              <p className="mt-1 text-muted-foreground">
                Lacak kurir, nomor resi, status order, dan alamat pengiriman.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedOrder ? (
                <Button type="button" variant="outline" onClick={closeTracking}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Semua Tracking
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={loadTrackingData}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>

              <Button asChild variant="outline">
                <a href={isSeller ? "/dashboard/penjual" : "/dashboard/pembeli"}>
                  Kembali Dashboard
                </a>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : selectedOrder ? (
            <TrackingDetail
              order={selectedOrder}
              buyer={profileMap[selectedOrder.buyer_id] ?? null}
              seller={
                selectedOrder.seller_id
                  ? profileMap[selectedOrder.seller_id] ?? null
                  : null
              }
              viewerRole={isSeller ? "seller" : isBuyer ? "buyer" : "admin"}
              onBack={closeTracking}
            />
          ) : (
            <TrackingList
              orders={filteredOrders}
              profileMap={profileMap}
              search={search}
              onSearchChange={setSearch}
              onOpenTracking={openTracking}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function TrackingList({
  orders,
  profileMap,
  search,
  onSearchChange,
  onOpenTracking,
}: {
  orders: OrderRow[];
  profileMap: Record<string, ProfileRow>;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenTracking: (orderId: string) => void;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Daftar Tracking</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pilih pesanan untuk melihat status pengiriman.
          </p>
        </div>

        <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {orders.length} pesanan
        </div>
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari order ID, produk, seller, buyer, resi, kurir..."
          className="pl-9"
        />
      </div>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyTrackingList />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const buyer = profileMap[order.buyer_id];
              const seller = order.seller_id
                ? profileMap[order.seller_id]
                : null;

              const firstItem = order.order_items?.[0];
              const firstProduct = firstItem
                ? getOrderItemProduct(firstItem)
                : null;

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-border bg-background p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />

                        <div className="font-mono text-sm font-semibold">
                          {order.id}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Dibuat:{" "}
                        {new Date(order.created_at).toLocaleString("id-ID")}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                        <InfoLine
                          label="Buyer"
                          value={profileDisplayName(buyer, "Buyer")}
                        />
                        <InfoLine
                          label="Seller"
                          value={profileDisplayName(seller, "Seller")}
                        />
                        <InfoLine
                          label="Produk"
                          value={
                            firstProduct
                              ? `${firstProduct.title}${order.order_items.length > 1
                                ? ` +${order.order_items.length - 1} lainnya`
                                : ""
                              }`
                              : "-"
                          }
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={orderStatusClass(order.order_status)}>
                          {orderStatusLabel(order.order_status)}
                        </span>

                        <span className={paymentStatusClass(order.payment_status)}>
                          {paymentStatusLabel(order.payment_status)}
                        </span>

                        {order.tracking_number ? (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                            Resi Tersedia
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Belum Ada Resi
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <div className="text-sm text-muted-foreground">Total</div>

                      <div className="text-2xl font-bold text-primary">
                        {formatIDR(getOrderTotal(order))}
                      </div>

                      <Button
                        type="button"
                        onClick={() => onOpenTracking(order.id)}
                        className="mt-4 gradient-brand text-white"
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Lacak Pesanan
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TrackingDetail({
  order,
  buyer,
  seller,
  viewerRole,
  onBack,
}: {
  order: OrderRow;
  buyer: ProfileRow | null;
  seller: ProfileRow | null;
  viewerRole: "buyer" | "seller" | "admin";
  onBack: () => void;
}) {
  const timeline = buildTrackingTimeline(order);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Tracking
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`/invoice?order=${order.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </a>
          </Button>

          <Button asChild variant="outline">
            <a href={viewerRole === "seller" ? "/dashboard/penjual" : "/dashboard/pembeli"}>
              Dashboard
            </a>
          </Button>
        </div>
      </div>

      <article className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Truck className="h-4 w-4" />
                  Tracking ReVibe
                </div>

                <h2 className="mt-4 text-2xl font-bold">Detail Pengiriman</h2>

                <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
                  Order {order.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={orderStatusClass(order.order_status)}>
                  {orderStatusLabel(order.order_status)}
                </span>

                <span className={paymentStatusClass(order.payment_status)}>
                  {paymentStatusLabel(order.payment_status)}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <PartyCard
                icon={<UserRound className="h-5 w-5 text-primary" />}
                title="Buyer"
                name={profileDisplayName(buyer, "Buyer")}
                phone={buyer?.whatsapp ?? null}
                address={buildProfileAddress(buyer)}
              />

              <PartyCard
                icon={<Store className="h-5 w-5 text-primary" />}
                title="Seller"
                name={profileDisplayName(seller, "Seller")}
                phone={seller?.whatsapp ?? null}
                address={buildProfileAddress(seller)}
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <TrackingInfoCard
                icon={<Truck className="h-5 w-5 text-primary" />}
                label="Kurir"
                value={order.courier || "-"}
              />

              <TrackingInfoCard
                icon={<Clipboard className="h-5 w-5 text-primary" />}
                label="Nomor Resi"
                value={order.tracking_number || "Belum tersedia"}
                action={
                  order.tracking_number ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(order.tracking_number || "")}
                    >
                      Salin
                    </Button>
                  ) : null
                }
              />

              <TrackingInfoCard
                icon={<Clock className="h-5 w-5 text-primary" />}
                label="Tanggal Kirim"
                value={
                  order.shipped_at
                    ? new Date(order.shipped_at).toLocaleString("id-ID")
                    : "Belum dikirim"
                }
              />
            </div>

            <div className="mt-6 rounded-2xl bg-green-100 p-4 text-green-950">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4" />
                Alamat Pengiriman
              </div>

              <div className="mt-2 text-sm text-green-900">
                {order.shipping_address || "-"}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              <div className="bg-accent px-4 py-3 font-semibold">
                Produk Dikirim
              </div>

              <div className="divide-y divide-border">
                {(order.order_items ?? []).map((item) => {
                  const product = getOrderItemProduct(item);
                  const image = product?.images?.[0] ?? "";
                  const itemPrice = Number(item.price ?? 0);
                  const itemQuantity = Number(item.quantity ?? 0);
                  const itemTotal = itemPrice * itemQuantity;

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 p-4 md:grid-cols-[72px_1fr_auto]"
                    >
                      <a
                        href={`/detail-produk?id=${item.product_id}`}
                        className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-muted"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product?.title ?? "Produk"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </a>

                      <div>
                        <a
                          href={`/detail-produk?id=${item.product_id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {product?.title ?? "Produk"}
                        </a>

                        <div className="mt-1 text-sm text-muted-foreground">
                          {itemQuantity} x {formatIDR(itemPrice)}
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <div className="text-sm text-muted-foreground">
                          Subtotal
                        </div>

                        <div className="font-bold">{formatIDR(itemTotal)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold">Ringkasan Tracking</h3>

              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  label="Status Order"
                  value={orderStatusLabel(order.order_status)}
                />
                <SummaryRow
                  label="Status Bayar"
                  value={paymentStatusLabel(order.payment_status)}
                />
                <SummaryRow
                  label="Metode Kirim"
                  value={order.shipping_method || "-"}
                />
                <SummaryRow label="Kurir" value={order.courier || "-"} />
                <SummaryRow
                  label="Nomor Resi"
                  value={order.tracking_number || "-"}
                />
                <div className="border-t border-border pt-3">
                  <SummaryRow
                    label="Total"
                    value={formatIDR(getOrderTotal(order))}
                    strong
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold">Timeline Pesanan</h3>

              <div className="mt-5 space-y-4">
                {timeline.map((item, index) => (
                  <TimelineItem
                    key={`${item.title}-${index}`}
                    title={item.title}
                    description={item.description}
                    date={item.date}
                    done={item.done}
                    active={item.active}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
              Tracking ini memakai status internal ReVibe. Untuk tracking real-time
              ekspedisi, salin nomor resi lalu cek di website resmi kurir.
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  date,
  done,
  active,
}: {
  title: string;
  description: string;
  date: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-yellow-100 text-yellow-700"
              : "bg-muted text-muted-foreground"
          }`}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </div>

      <div>
        <div className="font-semibold">{title}</div>

        <div className="mt-1 text-sm text-muted-foreground">{description}</div>

        <div className="mt-1 text-xs text-muted-foreground">{date}</div>
      </div>
    </div>
  );
}

function PartyCard({
  icon,
  title,
  name,
  phone,
  address,
}: {
  icon: React.ReactNode;
  title: string;
  name: string;
  phone: string | null;
  address: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>

      <div className="mt-3 font-bold">{name}</div>

      {phone ? (
        <div className="mt-1 text-sm text-muted-foreground">{phone}</div>
      ) : null}

      <div className="mt-2 text-sm text-muted-foreground">{address || "-"}</div>
    </div>
  );
}

function TrackingInfoCard({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>{icon}</div>
        {action}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">{label}</div>

      <div className="mt-1 break-all font-semibold">{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>

      <span className={strong ? "text-lg font-bold text-primary" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}

function EmptyTrackingList() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Truck className="mx-auto h-10 w-10 text-primary" />

      <h3 className="mt-4 text-lg font-semibold">Belum ada pesanan</h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Tracking akan muncul setelah ada pesanan.
      </p>

      <Button asChild className="mt-6 gradient-brand text-white">
        <a href="/produk">Mulai Belanja</a>
      </Button>
    </div>
  );
}

function buildTrackingTimeline(order: OrderRow) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);

  const isPaid =
    paymentStatus === "dibayar" ||
    paymentStatus === "paid" ||
    paymentStatus === "settlement" ||
    paymentStatus === "success";

  const isProcessing =
    orderStatus === "menunggu_konfirmasi_penjual" ||
    orderStatus === "menunggu_konfirmasi" ||
    orderStatus === "diproses_penjual" ||
    orderStatus === "diproses" ||
    orderStatus === "processing";

  const isShipped =
    orderStatus === "dikirim" ||
    orderStatus === "shipped" ||
    Boolean(order.tracking_number);

  const isCompleted =
    orderStatus === "selesai" ||
    orderStatus === "pesanan_diterima" ||
    orderStatus === "diterima" ||
    orderStatus === "completed" ||
    orderStatus === "delivered";

  const isCancelled =
    orderStatus === "dibatalkan" || orderStatus === "cancelled";

  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleString("id-ID")
    : "-";

  const updatedDate = order.updated_at
    ? new Date(order.updated_at).toLocaleString("id-ID")
    : "-";

  const shippedDate = order.shipped_at
    ? new Date(order.shipped_at).toLocaleString("id-ID")
    : "-";

  return [
    {
      title: "Pesanan Dibuat",
      description: "Buyer membuat pesanan melalui checkout.",
      date: createdDate,
      done: true,
      active: false,
    },
    {
      title: "Pembayaran",
      description: isPaid
        ? "Pembayaran sudah tercatat."
        : "Pembayaran masih menunggu atau belum berhasil.",
      date: isPaid ? createdDate : "-",
      done: isPaid,
      active: !isPaid && !isCancelled,
    },
    {
      title: "Diproses Seller",
      description:
        isProcessing || isShipped || isCompleted
          ? "Seller sedang/ sudah memproses pesanan."
          : "Pesanan belum diproses seller.",
      date: isProcessing || isShipped || isCompleted ? updatedDate : "-",
      done: isProcessing || isShipped || isCompleted,
      active: isPaid && !isProcessing && !isShipped && !isCompleted && !isCancelled,
    },
    {
      title: "Dikirim",
      description: isShipped
        ? `Pesanan dikirim${order.courier ? ` via ${order.courier}` : ""}${order.tracking_number ? ` dengan resi ${order.tracking_number}` : ""
        }.`
        : "Nomor resi belum tersedia.",
      date: isShipped ? shippedDate : "-",
      done: isShipped,
      active: isProcessing && !isShipped && !isCompleted && !isCancelled,
    },
    {
      title: "Selesai / Diterima",
      description: isCompleted
        ? "Pesanan sudah selesai atau diterima buyer."
        : "Pesanan belum ditandai selesai.",
      date: isCompleted ? updatedDate : "-",
      done: isCompleted,
      active: isShipped && !isCompleted && !isCancelled,
    },
    {
      title: isCancelled ? "Pesanan Dibatalkan" : "Riwayat Lanjutan",
      description: isCancelled
        ? "Pesanan ini sudah dibatalkan."
        : "Invoice, ulasan, dan komplain bisa dicek dari dashboard terkait.",
      date: isCancelled ? updatedDate : "-",
      done: isCancelled,
      active: false,
    },
  ];
}

async function copyText(value: string) {
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
    toast.success("Nomor resi disalin.");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    toast.success("Nomor resi disalin.");
  }
}

function readOrderIdFromUrl() {
  if (typeof window === "undefined") return "";

  return new URLSearchParams(window.location.search).get("order") ?? "";
}

function getOrderItemProduct(item: OrderItemRow) {
  if (Array.isArray(item.products)) {
    return item.products[0] ?? null;
  }

  return item.products ?? null;
}

function getOrderTotal(order: OrderRow) {
  const total = Number(order.total ?? 0);

  if (Number.isFinite(total) && total > 0) return total;

  return calculateItemsSubtotal(order) + Number(order.shipping_cost ?? 0);
}

function calculateItemsSubtotal(order: OrderRow) {
  return (order.order_items ?? []).reduce((sum, item) => {
    return sum + Number(item.price ?? 0) * Number(item.quantity ?? 0);
  }, 0);
}

function buildProfileAddress(profile: ProfileRow | null) {
  if (!profile) return "-";

  const address = profile.address?.trim() ?? "";
  const city = profile.city?.trim() ?? "";

  if (address && city) return `${address}, ${city}`;
  if (address) return address;
  if (city) return city;

  return "-";
}

function profileDisplayName(profile: ProfileRow | null | undefined, fallback: string) {
  if (!profile) return fallback;

  return profile.shop_name || profile.full_name || fallback;
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

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}