import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  formatIDR,
  getSellerSalesReport,
  orderStatusLabel,
  paymentStatusLabel,
  type SellerDailySales,
  type SellerReportTransaction,
  type SellerSalesReport,
  type SellerTopProduct,
} from "@/lib/seller-report";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/penjual/laporan")({
  component: () => (
    <RoleGuard required="seller">
      <SellerSalesReportPage />
    </RoleGuard>
  ),
});

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getThirtyDaysAgoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  return date.toISOString().slice(0, 10);
}

function SellerSalesReportPage() {
  const { user } = useAuth();

  const [startDate, setStartDate] = useState(getThirtyDaysAgoDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  const [report, setReport] = useState<SellerSalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const rows = await getSellerSalesReport({
        sellerId: user.id,
        startDate,
        endDate,
      });

      setReport(rows);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat laporan penjualan.",
      );

      console.error("[Load Seller Sales Report Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [user]);

  const stats = useMemo(() => {
    const summary = report?.summary;

    return [
      {
        label: "Omzet Selesai",
        value: formatIDR(summary?.completed_revenue ?? 0),
        icon: BarChart3,
      },
      {
        label: "Total Order",
        value: String(summary?.total_orders ?? 0),
        icon: ShoppingBag,
      },
      {
        label: "Order Selesai",
        value: String(summary?.completed_orders ?? 0),
        icon: CheckCircle2,
      },
      {
        label: "Sedang Diproses",
        value: String(summary?.processing_orders ?? 0),
        icon: Clock,
      },
      {
        label: "Dikirim",
        value: String(summary?.shipped_orders ?? 0),
        icon: Truck,
      },
      {
        label: "Dibatalkan",
        value: String(summary?.cancelled_orders ?? 0),
        icon: XCircle,
      },
      {
        label: "Produk Terjual",
        value: String(summary?.total_units_sold ?? 0),
        icon: Package,
      },
    ];
  }, [report]);

  function handleApplyFilter() {
    if (!startDate || !endDate) {
      toast.error("Tanggal awal dan tanggal akhir wajib diisi.");
      return;
    }

    if (startDate > endDate) {
      toast.error("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      return;
    }

    loadReport();
  }

  function handleResetFilter() {
    const defaultStart = getThirtyDaysAgoDate();
    const defaultEnd = getTodayDate();

    setStartDate(defaultStart);
    setEndDate(defaultEnd);

    window.setTimeout(() => {
      loadReport();
    }, 0);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Laporan Penjualan</h1>

              <p className="mt-1 text-muted-foreground">
                Pantau omzet, grafik penjualan, produk paling laku, dan riwayat
                transaksi toko kamu.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/penjual">Dashboard Penjual</a>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={loadReport}
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

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tanggal Awal</label>

                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Tanggal Akhir</label>

                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleApplyFilter}
                  disabled={loading}
                  className="w-full"
                >
                  Terapkan
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilter}
                  disabled={loading}
                  className="w-full"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : !report ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-primary" />

              <h3 className="mt-4 text-lg font-semibold">
                Laporan belum tersedia
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Coba refresh atau ubah rentang tanggal.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-7">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <stat.icon className="h-5 w-5 text-primary" />

                    <div className="mt-3 text-xl font-bold">{stat.value}</div>

                    <div className="text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <SalesChart data={report.daily_sales} />
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <TopProductsCard products={report.top_products} />

                <TransactionList transactions={report.transactions} />
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SalesChart({ data }: { data: SellerDailySales[] }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
  const totalUnits = data.reduce((sum, item) => sum + item.units, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Grafik Penjualan</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Grafik omzet harian berdasarkan order yang sudah selesai.
          </p>
        </div>

        <div className="grid gap-2 text-right text-sm">
          <div>
            <span className="text-muted-foreground">Omzet: </span>
            <span className="font-semibold">{formatIDR(totalRevenue)}</span>
          </div>

          <div>
            <span className="text-muted-foreground">Order: </span>
            <span className="font-semibold">{totalOrders}</span>
          </div>

          <div>
            <span className="text-muted-foreground">Produk: </span>
            <span className="font-semibold">{totalUnits}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-background p-4">
        <div className="flex h-72 min-w-[720px] items-end gap-3">
          {data.map((item) => {
            const height = Math.max((item.revenue / maxRevenue) * 220, 8);

            return (
              <div
                key={item.date}
                className="flex min-w-14 flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="text-[10px] font-medium text-muted-foreground">
                  {item.revenue > 0 ? formatCompactIDR(item.revenue) : "0"}
                </div>

                <div
                  className="w-full rounded-t-xl bg-primary/80 transition hover:bg-primary"
                  style={{
                    height,
                  }}
                  title={`${item.label} | ${formatIDR(item.revenue)} | ${item.orders} order | ${item.units} produk`}
                />

                <div className="text-[10px] text-muted-foreground">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Arahkan cursor ke batang grafik untuk melihat detail omzet, order, dan
        jumlah produk terjual.
      </div>
    </div>
  );
}

function TopProductsCard({ products }: { products: SellerTopProduct[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Produk Paling Laku</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Berdasarkan order selesai dalam periode terpilih.
        </p>
      </div>

      <div className="mt-5">
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Package className="mx-auto h-9 w-9 text-primary" />

            <h3 className="mt-3 font-semibold">Belum ada produk terjual</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Produk akan muncul setelah order selesai.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={product.product_id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>

                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.product_image ? (
                    <img
                      src={product.product_image}
                      alt={product.product_title}
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
                    {product.product_title}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {product.quantity_sold} terjual
                  </div>
                </div>

                <div className="text-right text-sm font-semibold">
                  {formatIDR(product.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionList({
  transactions,
}: {
  transactions: SellerReportTransaction[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Semua transaksi toko dalam periode terpilih.
        </p>
      </div>

      <div className="mt-5">
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <ShoppingBag className="mx-auto h-9 w-9 text-primary" />

            <h3 className="mt-3 font-semibold">Belum ada transaksi</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Transaksi akan muncul setelah buyer membuat order.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionCard({
  transaction,
}: {
  transaction: SellerReportTransaction;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-semibold">
            {transaction.id}
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(transaction.created_at).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={transaction.order_status} />
          <PaymentStatusBadge status={transaction.payment_status} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {transaction.order_items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-medium">
                {item.product_title}
              </div>

              <div className="text-xs text-muted-foreground">
                {item.quantity} x {formatIDR(item.price)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-4 text-sm md:grid-cols-2">
        <Info label="Subtotal" value={formatIDR(transaction.subtotal)} />

        <Info label="Ongkir" value={formatIDR(transaction.shipping_cost)} />

        <Info label="Total" value={formatIDR(transaction.total)} strong />

        <Info
          label="Resi"
          value={
            transaction.tracking_number
              ? `${transaction.courier || "-"} - ${transaction.tracking_number}`
              : "-"
          }
        />
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const className =
    {
      menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
      menunggu_konfirmasi_penjual: "bg-blue-100 text-blue-800",
      diproses_penjual: "bg-blue-100 text-blue-800",
      dikirim: "bg-purple-100 text-purple-800",
      pesanan_diterima: "bg-green-100 text-green-800",
      selesai: "bg-green-100 text-green-800",
      dibatalkan: "bg-red-100 text-red-800",
    }[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {orderStatusLabel(status)}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const className =
    {
      menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
      dibayar: "bg-green-100 text-green-800",
      gagal: "bg-red-100 text-red-800",
      dikembalikan: "bg-slate-100 text-slate-700",
    }[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {paymentStatusLabel(status)}
    </span>
  );
}

function Info({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>

      <div className={strong ? "font-bold text-primary" : "font-medium"}>
        {value}
      </div>
    </div>
  );
}

function formatCompactIDR(value: number) {
  if (value >= 1000000) {
    return `${Math.round(value / 1000000)}jt`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}rb`;
  }

  return String(value);
}