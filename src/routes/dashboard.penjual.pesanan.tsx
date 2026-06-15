import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  acceptSellerOrder,
  formatIDR,
  getSellerOrders,
  orderStatusLabel,
  paymentStatusLabel,
  shipSellerOrder,
  type SellerOrder,
} from "@/lib/seller-orders";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/penjual/pesanan")({
  component: () => (
    <RoleGuard required="seller">
      <SellerOrdersPage />
    </RoleGuard>
  ),
});

function SellerOrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadOrders() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const rows = await getSellerOrders(user.id);
      setOrders(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat pesanan.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  async function handleAccept(order: SellerOrder) {
    if (!user) return;

    setUpdatingId(order.id);

    try {
      await acceptSellerOrder({
        sellerId: user.id,
        orderId: order.id,
      });

      toast.success("Pesanan berhasil diproses.");
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memproses pesanan.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleShip(order: SellerOrder, courier: string, resi: string) {
    if (!user) return;

    setUpdatingId(order.id);

    try {
      await shipSellerOrder({
        sellerId: user.id,
        orderId: order.id,
        courier,
        trackingNumber: resi,
      });

      toast.success("Resi berhasil disimpan dan pesanan ditandai dikirim.");
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan resi.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Pesanan Masuk</h1>

              <p className="mt-1 text-muted-foreground">
                Kelola pesanan buyer, proses pesanan, dan input nomor resi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/penjual">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </a>
              </Button>

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
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-primary" />

                <h3 className="mt-4 text-lg font-semibold">
                  Belum ada pesanan
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Pesanan buyer akan muncul di halaman ini.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <SellerOrderCard
                    key={order.id}
                    order={order}
                    updating={updatingId === order.id}
                    onAccept={() => handleAccept(order)}
                    onShip={(courier, resi) => handleShip(order, courier, resi)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SellerOrderCard({
  order,
  updating,
  onAccept,
  onShip,
}: {
  order: SellerOrder;
  updating: boolean;
  onAccept: () => void;
  onShip: (courier: string, resi: string) => void;
}) {
  const [courier, setCourier] = useState(order.courier ?? "");
  const [resi, setResi] = useState(order.tracking_number ?? "");

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-semibold">{order.id}</div>

          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {orderStatusLabel(order.order_status)}
          </span>

          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            {paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {item.products?.images?.[0] ? (
                <img
                  src={item.products.images[0]}
                  alt={item.products.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 font-medium">
                {item.products?.title ?? "Produk"}
              </div>

              <div className="text-sm text-muted-foreground">
                {item.quantity} x {formatIDR(Number(item.price))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-2">
        <Info label="Total" value={formatIDR(Number(order.total ?? 0))} />
        <Info label="Metode Bayar" value={order.payment_method ?? "-"} />
        <Info label="Metode Kirim" value={order.shipping_method ?? "-"} />
        <Info label="Resi" value={order.tracking_number ?? "-"} />
      </div>

      <div className="mt-4 rounded-xl bg-accent p-4 text-sm">
        <div className="font-semibold">Alamat Pengiriman</div>
        <div className="mt-2 whitespace-pre-line text-muted-foreground">
          {order.shipping_address || "-"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input
          value={courier}
          onChange={(event) => setCourier(event.target.value)}
          placeholder="Jasa kirim, contoh: JNE"
        />

        <Input
          value={resi}
          onChange={(event) => setResi(event.target.value)}
          placeholder="Nomor resi"
        />

        {order.order_status === "menunggu_konfirmasi_penjual" ? (
          <Button type="button" onClick={onAccept} disabled={updating}>
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Proses
          </Button>
        ) : null}

        {["diproses_penjual", "menunggu_konfirmasi_penjual"].includes(
          order.order_status,
        ) ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onShip(courier, resi)}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            Simpan Resi
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}