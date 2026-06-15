import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquareReply,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  complaintReasonLabel,
  complaintStatusLabel,
  getSellerComplaints,
  resolveComplaint,
  updateSellerComplaintResponse,
  type ComplaintRow,
} from "@/lib/complaints";

const db = supabase as any;

export const Route = createFileRoute("/komplain/penjual")({
  component: () => (
    <RoleGuard required="seller">
      <SellerComplaintPage />
    </RoleGuard>
  ),
});

type OrderLite = {
  id: string;
  buyer_id: string;
  seller_id: string;
  order_status: string;
  payment_status: string;
  total: number | string | null;
  courier: string | null;
  tracking_number: string | null;
  shipping_address: string | null;
  created_at: string;
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number | string;
    products:
    | {
      id: string;
      title: string;
      images: string[] | null;
    }
    | {
      id: string;
      title: string;
      images: string[] | null;
    }[]
    | null;
  }>;
};

function SellerComplaintPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<ComplaintRow[]>([]);
  const [orderMap, setOrderMap] = useState<Record<string, OrderLite>>({});
  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintRow | null>(null);
  const [response, setResponse] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const highlightedComplaintId = useMemo(() => {
    if (typeof window === "undefined") return "";

    return new URLSearchParams(window.location.search).get("complaint") ?? "";
  }, []);

  async function loadComplaints() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const rows = await getSellerComplaints(user.id);
      setItems(rows);

      const orderIds = rows.map((item) => item.order_id).filter(Boolean);

      if (orderIds.length > 0) {
        const { data: orderRows, error: orderError } = await db
          .from("orders")
          .select(
            `
            id,
            buyer_id,
            seller_id,
            order_status,
            payment_status,
            total,
            courier,
            tracking_number,
            shipping_address,
            created_at,
            order_items(
              id,
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
          .eq("seller_id", user.id)
          .in("id", orderIds);

        if (orderError) {
          console.error("[Seller Complaint Orders Load Error]", orderError);
          setOrderMap({});
        } else {
          const nextOrderMap: Record<string, OrderLite> = {};

          (orderRows ?? []).forEach((order: OrderLite) => {
            nextOrderMap[String(order.id)] = order;
          });

          setOrderMap(nextOrderMap);
        }
      } else {
        setOrderMap({});
      }

      if (highlightedComplaintId) {
        window.setTimeout(() => {
          document
            .getElementById(`seller-complaint-${highlightedComplaintId}`)
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        }, 250);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat komplain.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = db
      .channel(`seller_complaints_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_complaints",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          loadComplaints();
        },
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;

      const keyword = search.trim().toLowerCase();

      if (!keyword) return true;

      const order = orderMap[item.order_id];

      const productText = (order?.order_items ?? [])
        .map((orderItem) => {
          const product = Array.isArray(orderItem.products)
            ? orderItem.products[0]
            : orderItem.products;

          return product?.title ?? "";
        })
        .join(" ");

      const text = [
        item.id,
        item.order_id,
        item.reason,
        item.description,
        item.status,
        item.seller_response,
        order?.tracking_number,
        order?.courier,
        order?.shipping_address,
        productText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, search, filter, orderMap]);

  const openCount = items.filter((item) => item.status === "open").length;
  const respondedCount = items.filter(
    (item) => item.status === "seller_responded",
  ).length;
  const resolvedCount = items.filter((item) => item.status === "resolved").length;

  async function handleSubmitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id || !selectedComplaint) {
      toast.error("Data komplain tidak valid.");
      return;
    }

    setSaving(true);

    try {
      await updateSellerComplaintResponse({
        sellerId: user.id,
        complaintId: selectedComplaint.id,
        response,
      });

      toast.success("Respons seller berhasil dikirim.");
      setSelectedComplaint(null);
      setResponse("");
      await loadComplaints();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengirim respons.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(item: ComplaintRow) {
    if (!user?.id) return;

    const confirmed = window.confirm("Tandai komplain ini sebagai selesai?");

    if (!confirmed) return;

    setSaving(true);

    try {
      await resolveComplaint({
        userId: user.id,
        complaintId: item.id,
      });

      toast.success("Komplain ditandai selesai.");
      await loadComplaints();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyelesaikan komplain.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Komplain Buyer</h1>

              <p className="mt-1 text-muted-foreground">
                Lihat, respons, dan selesaikan komplain yang diajukan pembeli.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadComplaints}
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
                <a href="/dashboard/penjual?tab=orders">
                  Kembali ke Pesanan
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatBox label="Menunggu Respons" value={openCount} />
            <StatBox label="Sudah Direspons" value={respondedCount} />
            <StatBox label="Selesai" value={resolvedCount} />
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari komplain, order ID, alasan, produk, resi..."
                  className="pl-9"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="open">Menunggu Respons</option>
                <option value="seller_responded">Sudah Direspons</option>
                <option value="resolved">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <EmptySellerComplaints />
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <SellerComplaintCard
                      key={item.id}
                      item={item}
                      order={orderMap[item.order_id] ?? null}
                      highlighted={highlightedComplaintId === item.id}
                      saving={saving}
                      onRespond={() => {
                        setSelectedComplaint(item);
                        setResponse(item.seller_response ?? "");
                      }}
                      onResolve={() => handleResolve(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {selectedComplaint ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmitResponse}
            className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Respons Komplain</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Order {selectedComplaint.order_id}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedComplaint(null)}
              >
                Tutup
              </Button>
            </div>

            <div className="mt-5 rounded-xl bg-accent p-4 text-sm">
              <div className="font-semibold">
                {complaintReasonLabel(selectedComplaint.reason)}
              </div>

              <p className="mt-2 text-muted-foreground">
                {selectedComplaint.description}
              </p>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium">Respons Seller</label>

              <Textarea
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                rows={6}
                placeholder="Tulis solusi atau penjelasan untuk buyer."
                className="mt-2"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedComplaint(null)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="gradient-brand text-white"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquareReply className="mr-2 h-4 w-4" />
                )}
                Kirim Respons
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SellerComplaintCard({
  item,
  order,
  highlighted,
  saving,
  onRespond,
  onResolve,
}: {
  item: ComplaintRow;
  order: OrderLite | null;
  highlighted: boolean;
  saving: boolean;
  onRespond: () => void;
  onResolve: () => void;
}) {
  const products = order?.order_items ?? [];

  return (
    <div
      id={`seller-complaint-${item.id}`}
      className={`rounded-2xl border bg-background p-5 ${highlighted
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
        }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-sm font-semibold">
            Komplain {item.id}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Order {item.order_id}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Dibuat: {new Date(item.created_at).toLocaleString("id-ID")}
          </div>
        </div>

        <span className={complaintStatusClass(item.status)}>
          {complaintStatusLabel(item.status)}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-accent p-4 text-sm">
        <div className="font-semibold">{complaintReasonLabel(item.reason)}</div>

        <p className="mt-2 text-muted-foreground">{item.description}</p>
      </div>

      {products.length > 0 ? (
        <div className="mt-4 space-y-3">
          {products.map((orderItem) => {
            const product = Array.isArray(orderItem.products)
              ? orderItem.products[0]
              : orderItem.products;

            const image = product?.images?.[0] ?? "";

            return (
              <div
                key={orderItem.id}
                className="flex gap-3 rounded-xl border border-border p-3"
              >
                <a
                  href={`/detail-produk?id=${orderItem.product_id}`}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
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
                    href={`/detail-produk?id=${orderItem.product_id}`}
                    className="font-medium hover:text-primary"
                  >
                    {product?.title ?? "Produk"}
                  </a>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {orderItem.quantity} x {formatIDR(Number(orderItem.price))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {order ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-border p-4 text-sm md:grid-cols-3">
          <Info label="Total Order" value={formatIDR(Number(order.total ?? 0))} />
          <Info label="Kurir" value={order.courier || "-"} />
          <Info label="Resi" value={order.tracking_number || "-"} />
        </div>
      ) : null}

      {item.seller_response ? (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="font-semibold text-primary">Respons Kamu</div>

          <p className="mt-2 text-muted-foreground">{item.seller_response}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {item.status !== "resolved" && item.status !== "cancelled" ? (
          <>
            <Button type="button" variant="outline" onClick={onRespond}>
              <MessageSquareReply className="mr-2 h-4 w-4" />
              {item.seller_response ? "Edit Respons" : "Respons"}
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={onResolve}
              className="gradient-brand text-white"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tandai Selesai
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <AlertTriangle className="h-6 w-6 text-primary" />

      <div className="mt-4 text-2xl font-bold">{value}</div>

      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptySellerComplaints() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Package className="mx-auto h-10 w-10 text-primary" />

      <h3 className="mt-4 text-lg font-semibold">Belum ada komplain</h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Komplain buyer akan muncul di sini setelah pembeli mengajukan laporan
        dari dashboard pembeli.
      </p>

      <Button asChild className="mt-6 gradient-brand text-white">
        <a href="/dashboard/penjual?tab=orders">Kembali ke Pesanan</a>
      </Button>
    </div>
  );
}

function complaintStatusClass(status: string) {
  if (status === "resolved") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }

  if (status === "seller_responded") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }

  if (status === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }

  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
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

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}