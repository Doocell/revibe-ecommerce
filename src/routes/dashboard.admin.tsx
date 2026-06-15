import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  getAdminProducts,
  updateProductStatus,
  type AdminProduct,
  type ProductStatus,
} from "@/lib/admin-products";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin")({
  component: () => (
    <RoleGuard required="admin">
      <AdminDashboard />
    </RoleGuard>
  ),
});

const filters: Array<{ value: ProductStatus | "all"; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "inactive", label: "Nonaktif" },
];

type AdminMenu = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  status: "ready" | "next";
};

type AdminStat = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  href?: string;
};

function AdminDashboard() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filter, setFilter] = useState<ProductStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const menus: AdminMenu[] = [
    {
      title: "Monitoring Transaksi",
      description:
        "Pantau semua transaksi buyer dan seller, status pembayaran, status order, resi, pembatalan, dan restore stok.",
      href: "/dashboard/admin/transaksi",
      icon: ShoppingBag,
      primary: true,
      status: "ready",
    },
    {
      title: "Monitoring User",
      description:
        "Lihat akun buyer, seller, admin, status aktif/nonaktif, jumlah order, dan jumlah produk seller.",
      href: "/dashboard/admin/users",
      icon: Users,
      primary: true,
      status: "ready",
    },
    {
      title: "Notifikasi Sistem",
      description:
        "Lihat notifikasi order, pembayaran, pengiriman, pembatalan, chat, dan aktivitas marketplace.",
      href: "/notifikasi",
      icon: Bell,
      status: "ready",
    },
    {
      title: "Monitoring Seller",
      description:
        "Pantau toko seller, produk aktif, transaksi seller, dan performa masing-masing seller.",
      href: "/dashboard/admin/seller",
      icon: Store,
      status: "next",
    },
    {
      title: "Monitoring Chat",
      description:
        "Pantau percakapan, laporan masalah, atau komplain antara buyer dan seller.",
      href: "/dashboard/admin/chat",
      icon: MessageCircle,
      status: "next",
    },
    {
      title: "Laporan Marketplace",
      description:
        "Lihat ringkasan transaksi, omzet marketplace, produk terjual, seller aktif, dan pembatalan.",
      href: "/dashboard/admin/laporan",
      icon: BarChart3,
      status: "next",
    },
  ];

  async function loadProducts() {
    setLoading(true);

    try {
      const rows = await getAdminProducts(filter);
      setProducts(rows);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat data produk admin.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [filter]);

  const stats = useMemo<AdminStat[]>(
    () => [
      {
        icon: Users,
        label: "Total Pengguna",
        value: "Lihat User",
        href: "/dashboard/admin/users",
      },
      {
        icon: Package,
        label: "Produk Filter Ini",
        value: products.length,
      },
      {
        icon: ShieldCheck,
        label: "Menunggu Verifikasi",
        value: products.filter((product) => product.status === "pending").length,
      },
      {
        icon: CreditCard,
        label: "Transaksi",
        value: "Lihat Transaksi",
        href: "/dashboard/admin/transaksi",
      },
    ],
    [products],
  );

  async function handleUpdateStatus(productId: string, status: ProductStatus) {
    setUpdatingId(productId);

    try {
      await updateProductStatus(productId, status);

      setProducts((current) =>
        current
          .map((product) =>
            product.id === productId ? { ...product, status } : product,
          )
          .filter((product) => filter === "all" || product.status === filter),
      );

      const message = {
        approved: "Produk berhasil disetujui dan akan tampil ke pembeli.",
        rejected: "Produk berhasil ditolak.",
        inactive: "Produk berhasil dinonaktifkan.",
        pending: "Produk dikembalikan ke status menunggu.",
      }[status];

      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status produk.",
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
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Admin Panel
                  </div>

                  <h1 className="mt-4 text-3xl font-bold">
                    Dashboard Admin ReVibe
                  </h1>

                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    Kelola verifikasi produk, pantau transaksi, monitoring user,
                    dan kontrol fitur utama marketplace.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild className="gradient-brand text-white">
                    <a href="/dashboard/admin/transaksi">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Monitoring Transaksi
                    </a>
                  </Button>

                  <Button asChild variant="outline">
                    <a href="/dashboard/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      Monitoring User
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={loadProducts}
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
            </div>

            <div className="grid gap-4 border-t border-border p-6 md:grid-cols-4">
              {stats.map((stat) => (
                <AdminStatCard key={stat.label} stat={stat} />
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => (
              <AdminMenuCard key={menu.title} menu={menu} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Verifikasi Produk</h2>

                <p className="text-sm text-muted-foreground">
                  Produk baru dari seller masuk ke status pending dan hanya
                  tampil publik setelah disetujui admin.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={filter === item.value ? "default" : "outline"}
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Tidak ada produk pada status ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <AdminProductCard
                      key={product.id}
                      product={product}
                      updating={updatingId === product.id}
                      onApprove={() =>
                        handleUpdateStatus(product.id, "approved")
                      }
                      onReject={() =>
                        handleUpdateStatus(product.id, "rejected")
                      }
                      onInactive={() =>
                        handleUpdateStatus(product.id, "inactive")
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-accent/40 p-5 text-sm text-muted-foreground">
            Catatan: tombol <b>Setujui</b> mengubah status produk menjadi{" "}
            <b>approved</b>. Setelah itu produk akan muncul di halaman{" "}
            <b>/produk</b> karena halaman produk hanya mengambil data dengan
            status approved.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function AdminStatCard({ stat }: { stat: AdminStat }) {
  const content = (
    <>
      <stat.icon className="h-6 w-6 text-primary" />

      <div className="mt-3 text-2xl font-bold">{stat.value}</div>

      <div className="text-sm text-muted-foreground">{stat.label}</div>
    </>
  );

  const className =
    "rounded-2xl border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-sm";

  if (stat.href) {
    return (
      <a href={stat.href} className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function AdminMenuCard({ menu }: { menu: AdminMenu }) {
  return (
    <a
      href={menu.href}
      className={`group rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-md ${menu.primary ? "border-primary/40 bg-primary/5" : "border-border bg-card"
        }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`rounded-2xl p-3 ${menu.primary
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
            }`}
        >
          <menu.icon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold group-hover:text-primary">
              {menu.title}
            </h2>

            {menu.status === "ready" ? (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Siap
              </span>
            ) : (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                Berikutnya
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {menu.description}
          </p>

          <div className="mt-4 text-sm font-medium text-primary">
            Buka fitur →
          </div>
        </div>
      </div>
    </a>
  );
}

function AdminProductCard({
  product,
  updating,
  onApprove,
  onReject,
  onInactive,
}: {
  product: AdminProduct;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
  onInactive: () => void;
}) {
  const image = product.images?.[0];

  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-[120px_1fr_auto]">
      <div className="h-28 w-full overflow-hidden rounded-xl bg-accent md:w-28">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{product.title}</h3>
          <StatusBadge status={product.status} />
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {product.description || "Tidak ada deskripsi."}
        </p>

        <div className="mt-3 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            Harga:{" "}
            <b className="text-foreground">
              Rp {Number(product.price).toLocaleString("id-ID")}
            </b>
          </div>

          <div>Stok: {product.stock}</div>

          <div>Kategori: {product.categories?.name ?? "Tanpa kategori"}</div>

          <div>Kondisi: {conditionLabel(product.condition)}</div>

          <div>Lokasi: {product.location ?? "-"}</div>

          <div>
            Seller:{" "}
            {product.seller?.shop_name ||
              product.seller?.full_name ||
              product.seller_id}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:w-40 md:flex-col">
        {product.status !== "approved" ? (
          <Button onClick={onApprove} disabled={updating}>
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Setujui
          </Button>
        ) : null}

        {product.status === "pending" ? (
          <Button variant="destructive" onClick={onReject} disabled={updating}>
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Tolak
          </Button>
        ) : null}

        {product.status === "approved" ? (
          <Button variant="outline" onClick={onInactive} disabled={updating}>
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Nonaktifkan
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const label = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    inactive: "Nonaktif",
  }[status];

  const className = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    inactive: "bg-slate-100 text-slate-700",
  }[status];

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function conditionLabel(condition: AdminProduct["condition"]) {
  return {
    like_new: "Seperti baru",
    very_good: "Sangat baik",
    good: "Baik",
    fair: "Cukup",
  }[condition];
}