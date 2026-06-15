import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  Package,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  cancelComplaint,
  COMPLAINT_REASONS,
  complaintReasonLabel,
  complaintStatusLabel,
  getBuyerComplaintOrders,
  resolveComplaint,
  submitOrderComplaint,
  type ComplaintOrder,
} from "@/lib/complaints";

export const Route = createFileRoute("/komplain")({
  component: ComplaintRouteSwitcher,
});

function ComplaintRouteSwitcher() {
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/komplain/penjual")
  ) {
    return <Outlet />;
  }

  return (
    <RoleGuard required="buyer">
      <BuyerComplaintPage />
    </RoleGuard>
  );
}

function BuyerComplaintPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<ComplaintOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ComplaintOrder | null>(
    null,
  );

  const [reason, setReason] = useState("barang_tidak_sesuai");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const highlightedComplaintId = useMemo(() => {
    if (typeof window === "undefined") return "";

    return new URLSearchParams(window.location.search).get("complaint") ?? "";
  }, []);

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
      const rows = await getBuyerComplaintOrders(user.id);
      setOrders(rows);

      if (highlightedComplaintId) {
        const matched = rows.find(
          (order) => order.complaint?.id === highlightedComplaintId,
        );

        if (matched) {
          setSelectedOrder(null);

          window.setTimeout(() => {
            document
              .getElementById(`buyer-complaint-${highlightedComplaintId}`)
              ?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
          }, 250);
        }
      }

      if (highlightedOrderId) {
        const matchedOrder = rows.find((order) => order.id === highlightedOrderId);

        if (matchedOrder) {
          if (
            !matchedOrder.complaint ||
            matchedOrder.complaint.status === "cancelled"
          ) {
            setSelectedOrder(matchedOrder);
          }

          window.setTimeout(() => {
            const targetId = matchedOrder.complaint
              ? `buyer-complaint-${matchedOrder.complaint.id}`
              : `buyer-complaint-order-${matchedOrder.id}`;

            document.getElementById(targetId)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 250);
        }
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
    loadOrders();
  }, [user?.id]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter((order) => {
      const text = [
        order.id,
        order.order_status,
        order.payment_status,
        order.tracking_number,
        order.courier,
        order.complaint?.reason,
        order.complaint?.description,
        order.complaint?.status,
        ...order.order_items.map((item) => item.title),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [orders, search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id || !selectedOrder) {
      toast.error("Data komplain tidak valid.");
      return;
    }

    setSaving(true);

    try {
      await submitOrderComplaint({
        buyerId: user.id,
        orderId: selectedOrder.id,
        sellerId: selectedOrder.seller_id,
        reason,
        description,
      });

      toast.success("Komplain berhasil dikirim ke seller.");
      setSelectedOrder(null);
      setDescription("");
      setReason("barang_tidak_sesuai");
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengirim komplain.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(order: ComplaintOrder) {
    if (!user?.id || !order.complaint) return;

    setSaving(true);

    try {
      await resolveComplaint({
        userId: user.id,
        complaintId: order.complaint.id,
      });

      toast.success("Komplain ditandai selesai.");
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyelesaikan komplain.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(order: ComplaintOrder) {
    if (!user?.id || !order.complaint) return;

    const confirmed = window.confirm("Batalkan komplain ini?");

    if (!confirmed) return;

    setSaving(true);

    try {
      await cancelComplaint({
        buyerId: user.id,
        complaintId: order.complaint.id,
      });

      toast.success("Komplain dibatalkan.");
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membatalkan komplain.",
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
              <h1 className="text-3xl font-bold">Komplain Pesanan</h1>

              <p className="mt-1 text-muted-foreground">
                Laporkan masalah pada pesanan yang sudah dikirim atau selesai.
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

              <Button asChild variant="outline">
                <a href="/dashboard/pembeli">Dashboard Pembeli</a>
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari order, produk, resi, status komplain..."
                className="pl-9"
              />
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <EmptyComplaintOrders />
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <BuyerComplaintCard
                      key={order.id}
                      order={order}
                      highlighted={
                        highlightedComplaintId === order.complaint?.id ||
                        highlightedOrderId === order.id
                      }
                      saving={saving}
                      onSelect={() => {
                        setSelectedOrder(order);
                        setDescription("");
                        setReason("barang_tidak_sesuai");
                      }}
                      onResolve={() => handleResolve(order)}
                      onCancel={() => handleCancel(order)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Buat Komplain</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Order {selectedOrder.id}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedOrder(null)}
              >
                Tutup
              </Button>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="text-sm font-medium">Alasan Komplain</label>

                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {COMPLAINT_REASONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Deskripsi Masalah</label>

                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  placeholder="Jelaskan masalahnya secara jelas."
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedOrder(null)}
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
                  <MessageSquareWarning className="mr-2 h-4 w-4" />
                )}
                Kirim Komplain
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function BuyerComplaintCard({
  order,
  highlighted,
  saving,
  onSelect,
  onResolve,
  onCancel,
}: {
  order: ComplaintOrder;
  highlighted: boolean;
  saving: boolean;
  onSelect: () => void;
  onResolve: () => void;
  onCancel: () => void;
}) {
  const complaint = order.complaint;

  return (
    <div
      id={
        complaint
          ? `buyer-complaint-${complaint.id}`
          : `buyer-complaint-order-${order.id}`
      }
      className={`rounded-2xl border bg-background p-5 ${highlighted
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
        }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-sm font-semibold">{order.id}</div>

          <div className="mt-1 text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString("id-ID")}
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            Kurir: {order.courier || "-"} · Resi:{" "}
            {order.tracking_number || "-"}
          </div>
        </div>

        {complaint ? (
          <span className={complaintStatusClass(complaint.status)}>
            {complaintStatusLabel(complaint.status)}
          </span>
        ) : (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            Belum Ada Komplain
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-xl border p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            <div>
              <div className="font-medium">{item.title}</div>

              <div className="mt-1 text-sm text-muted-foreground">
                {item.quantity} x {formatIDR(item.price)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {complaint ? (
        <div className="mt-4 rounded-xl bg-accent p-4 text-sm">
          <div className="font-semibold">
            {complaintReasonLabel(complaint.reason)}
          </div>

          <p className="mt-2 text-muted-foreground">{complaint.description}</p>

          {complaint.seller_response ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="font-semibold text-primary">Respons Seller</div>

              <p className="mt-2 text-muted-foreground">
                {complaint.seller_response}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {!complaint || complaint.status === "cancelled" ? (
          <Button
            type="button"
            onClick={onSelect}
            className="gradient-brand text-white"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Buat Komplain
          </Button>
        ) : null}

        {complaint?.status === "open" ||
          complaint?.status === "seller_responded" ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onResolve}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tandai Selesai
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={onCancel}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Batalkan
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function EmptyComplaintOrders() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Package className="mx-auto h-10 w-10 text-primary" />

      <h3 className="mt-4 text-lg font-semibold">
        Belum ada pesanan yang bisa dikomplain
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Komplain bisa dibuat untuk pesanan yang sudah dikirim atau selesai.
      </p>

      <Button asChild className="mt-6 gradient-brand text-white">
        <a href="/dashboard/pembeli">Kembali ke Dashboard Pembeli</a>
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

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}