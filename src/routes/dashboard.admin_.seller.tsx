import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatDateTime,
  formatIDR,
  getAdminSellers,
  setAdminSellerActiveStatus,
  type AdminSeller,
} from "@/lib/admin-sellers";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  UserX,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin_/seller")({
  component: () => (
    <RoleGuard required="admin">
      <AdminSellerPage />
    </RoleGuard>
  ),
});

const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

function AdminSellerPage() {
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  async function loadSellers(next?: { search?: string; status?: string }) {
    setLoading(true);

    try {
      const rows = await getAdminSellers({
        search: next?.search ?? search,
        status: next?.status ?? status,
        limit: 300,
      });

      setSellers(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data seller.",
      );
      console.error("[Load Admin Sellers Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSellers({ search: "", status: "" });
  }, []);

  const stats = useMemo(() => {
    return [
      {
        label: "Total Seller",
        value: sellers.length,
        icon: Store,
      },
      {
        label: "Seller Aktif",
        value: sellers.filter((item) => item.is_active).length,
        icon: CheckCircle2,
      },
      {
        label: "Seller Nonaktif",
        value: sellers.filter((item) => !item.is_active).length,
        icon: UserX,
      },
      {
        label: "Total Produk",
        value: sellers.reduce((sum, item) => sum + item.total_products, 0),
        icon: Package,
      },
      {
        label: "Total Order",
        value: sellers.reduce((sum, item) => sum + item.total_orders, 0),
        icon: ShoppingBag,
      },
      {
        label: "Omzet Seller",
        value: formatIDR(
          sellers.reduce((sum, item) => sum + item.gross_revenue, 0),
        ),
        icon: ShoppingBag,
      },
    ];
  }, [sellers]);

  function handleReset() {
    setSearch("");
    setStatus("");
    loadSellers({ search: "", status: "" });
  }

  async function handleToggleStatus(seller: AdminSeller) {
    const nextStatus = !seller.is_active;

    const confirmed = window.confirm(
      nextStatus
        ? `Aktifkan seller ${seller.shop_name || seller.full_name || seller.email}?`
        : `Nonaktifkan seller ${seller.shop_name || seller.full_name || seller.email}?`,
    );

    if (!confirmed) return;

    setUpdatingId(seller.seller_id);

    try {
      await setAdminSellerActiveStatus({
        sellerId: seller.seller_id,
        isActive: nextStatus,
      });

      toast.success(
        nextStatus
          ? "Seller berhasil diaktifkan."
          : "Seller berhasil dinonaktifkan.",
      );

      await loadSellers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status seller.",
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
              <h1 className="text-3xl font-bold">Monitoring Seller</h1>
              <p className="mt-1 text-muted-foreground">
                Pantau toko seller, produk aktif, transaksi seller, dan performa
                masing-masing seller.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard Admin
                </a>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => loadSellers()}
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

          <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <stat.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadSellers();
                  }}
                  placeholder="Cari toko, nama seller, email, WhatsApp, atau kota..."
                  className="pl-9"
                />
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button type="button" onClick={() => loadSellers()}>
                Terapkan
              </Button>

              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : sellers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <Store className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">
                  Seller tidak ditemukan
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Coba ubah filter atau kata kunci pencarian.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sellers.map((seller) => (
                  <SellerCard
                    key={seller.seller_id}
                    seller={seller}
                    updating={updatingId === seller.seller_id}
                    onToggleStatus={() => handleToggleStatus(seller)}
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

function SellerCard({
  seller,
  updating,
  onToggleStatus,
}: {
  seller: AdminSeller;
  updating: boolean;
  onToggleStatus: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              {seller.shop_name || seller.full_name || "Toko tanpa nama"}
            </h2>
            <StatusBadge active={seller.is_active} />
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {seller.full_name || "-"} • {seller.email || "-"}
          </p>

          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <Info label="WhatsApp" value={seller.whatsapp || "-"} />
            <Info
              label="Lokasi"
              value={seller.shop_location || seller.city || "-"}
            />
            <Info label="Tanggal Daftar" value={formatDateTime(seller.created_at)} />
            <Info label="Seller ID" value={seller.seller_id} />
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-4 lg:min-w-[640px]">
          <Info label="Produk Total" value={seller.total_products} />
          <Info label="Produk Aktif" value={seller.active_products} />
          <Info label="Pending" value={seller.pending_products} />
          <Info label="Ditolak" value={seller.rejected_products} />
          <Info label="Order Total" value={seller.total_orders} />
          <Info label="Order Selesai" value={seller.completed_orders} />
          <Info label="Order Batal" value={seller.cancelled_orders} />
          <Info label="Omzet" value={formatIDR(seller.gross_revenue)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={seller.is_active ? "destructive" : "default"}
            disabled={updating}
            onClick={onToggleStatus}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : seller.is_active ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {seller.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
      Aktif
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
      Nonaktif
    </span>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value || "-"}</div>
    </div>
  );
}