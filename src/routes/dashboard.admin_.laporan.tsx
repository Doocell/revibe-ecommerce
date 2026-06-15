import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatIDR,
  getAdminMarketplaceReport,
  type AdminMarketplaceReport,
} from "@/lib/admin-report";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  Users,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin_/laporan")({
  component: () => (
    <RoleGuard required="admin">
      <AdminMarketplaceReportPage />
    </RoleGuard>
  ),
});

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function AdminMarketplaceReportPage() {
  const [report, setReport] = useState<AdminMarketplaceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(getToday());

  async function loadReport(next?: { startDate?: string; endDate?: string }) {
    setLoading(true);

    try {
      const rows = await getAdminMarketplaceReport({
        startDate: next?.startDate ?? startDate,
        endDate: next?.endDate ?? endDate,
      });

      setReport(rows);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat laporan marketplace.",
      );
      console.error("[Load Admin Marketplace Report Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  const stats = useMemo(() => {
    const summary = report?.summary;

    return [
      {
        label: "Total User",
        value: summary?.total_users ?? 0,
        icon: Users,
      },
      {
        label: "Total Seller",
        value: summary?.total_sellers ?? 0,
        icon: Store,
      },
      {
        label: "Total Produk",
        value: summary?.total_products ?? 0,
        icon: Package,
      },
      {
        label: "Produk Approved",
        value: summary?.approved_products ?? 0,
        icon: CheckCircle2,
      },
      {
        label: "Total Transaksi",
        value: summary?.total_orders ?? 0,
        icon: ShoppingBag,
      },
      {
        label: "Transaksi Selesai",
        value: summary?.completed_orders ?? 0,
        icon: CheckCircle2,
      },
      {
        label: "Transaksi Batal",
        value: summary?.cancelled_orders ?? 0,
        icon: XCircle,
      },
      {
        label: "Omzet Aktif",
        value: formatIDR(summary?.gross_revenue ?? 0),
        icon: BarChart3,
      },
    ];
  }, [report]);

  function handleReset() {
    const nextStartDate = getDateDaysAgo(30);
    const nextEndDate = getToday();

    setStartDate(nextStartDate);
    setEndDate(nextEndDate);

    loadReport({
      startDate: nextStartDate,
      endDate: nextEndDate,
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Laporan Marketplace</h1>
              <p className="mt-1 text-muted-foreground">
                Lihat ringkasan transaksi, omzet marketplace, produk terjual,
                seller aktif, dan pembatalan.
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
                onClick={() => loadReport()}
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
              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Tanggal Mulai
                </div>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Tanggal Selesai
                </div>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => loadReport()}
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
                  onClick={handleReset}
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
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
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

              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <ReportPanel title="Produk Terlaris">
                  {report?.top_products.length ? (
                    <div className="space-y-3">
                      {report.top_products.map((product, index) => (
                        <div
                          key={product.product_id}
                          className="flex items-center gap-3 rounded-xl border border-border p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </div>

                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-accent">
                            {product.product_image ? (
                              <img
                                src={product.product_image}
                                alt={product.product_title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 font-medium">
                              {product.product_title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {product.quantity_sold} terjual •{" "}
                              {formatIDR(product.revenue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>Belum ada produk terjual pada periode ini.</EmptyText>
                  )}
                </ReportPanel>

                <ReportPanel title="Seller Performa Tertinggi">
                  {report?.top_sellers.length ? (
                    <div className="space-y-3">
                      {report.top_sellers.map((seller, index) => (
                        <div
                          key={seller.seller_id}
                          className="flex items-center gap-3 rounded-xl border border-border p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 font-medium">
                              {seller.seller_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {seller.email || "-"}
                            </div>
                          </div>

                          <div className="text-right text-sm">
                            <div className="font-semibold">
                              {formatIDR(seller.revenue)}
                            </div>
                            <div className="text-muted-foreground">
                              {seller.order_count} order
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyText>Belum ada seller dengan transaksi pada periode ini.</EmptyText>
                  )}
                </ReportPanel>
              </div>

              <div className="mt-8">
                <ReportPanel title="Ringkasan Harian">
                  {report?.daily_sales.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="py-3 pr-4">Tanggal</th>
                            <th className="py-3 pr-4">Order</th>
                            <th className="py-3 pr-4">Omzet</th>
                          </tr>
                        </thead>

                        <tbody>
                          {report.daily_sales.map((day) => (
                            <tr key={day.date} className="border-b border-border">
                              <td className="py-3 pr-4">{day.label}</td>
                              <td className="py-3 pr-4">{day.orders}</td>
                              <td className="py-3 pr-4 font-semibold">
                                {formatIDR(day.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyText>Belum ada transaksi pada periode ini.</EmptyText>
                  )}
                </ReportPanel>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ReportPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}