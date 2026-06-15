import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelAdminTransaction,
  formatIDR,
  getAdminTransactions,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  restoreAdminTransactionStock,
  shippingMethodLabel,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
  type AdminTransaction,
} from "@/lib/admin-transactions";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin_/transaksi")({
  component: () => (
    <RoleGuard required="admin">
      <AdminTransactionPage />
    </RoleGuard>
  ),
});

const orderStatusOptions = [
  { value: "", label: "Semua Status Order" },
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "menunggu_konfirmasi_penjual", label: "Menunggu Konfirmasi Penjual" },
  { value: "diproses_penjual", label: "Diproses Penjual" },
  { value: "dikirim", label: "Dikirim" },
  { value: "pesanan_diterima", label: "Pesanan Diterima" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const paymentStatusOptions = [
  { value: "", label: "Semua Status Pembayaran" },
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "dibayar", label: "Dibayar" },
  { value: "pembayaran_berhasil", label: "Pembayaran Berhasil" },
  { value: "pembayaran_diproses", label: "Pembayaran Diproses" },
  { value: "pembayaran_gagal", label: "Pembayaran Gagal" },
  { value: "dikembalikan", label: "Dikembalikan" },
  { value: "kedaluwarsa", label: "Kedaluwarsa" },
];

const orderActionOptions = orderStatusOptions.filter((item) => item.value);
const paymentActionOptions = paymentStatusOptions.filter((item) => item.value);

function AdminTransactionPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  async function loadTransactions() {
    setLoading(true);

    try {
      const rows = await getAdminTransactions({
        search,
        orderStatus,
        paymentStatus,
        limit: 200,
      });

      setTransactions(rows);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat transaksi admin.",
      );

      console.error("[Load Admin Transactions Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const stats = useMemo(() => {
    const waitingPayment = transactions.filter(
      (item) => item.order_status === "menunggu_pembayaran",
    ).length;

    const processing = transactions.filter((item) =>
      ["menunggu_konfirmasi_penjual", "diproses_penjual"].includes(
        item.order_status,
      ),
    ).length;

    const shipped = transactions.filter(
      (item) => item.order_status === "dikirim",
    ).length;

    const finished = transactions.filter((item) =>
      ["pesanan_diterima", "selesai"].includes(item.order_status),
    ).length;

    const cancelled = transactions.filter(
      (item) => item.order_status === "dibatalkan",
    ).length;

    const activeGross = transactions
      .filter((item) => item.order_status !== "dibatalkan")
      .reduce((sum, item) => sum + Number(item.total ?? 0), 0);

    return [
      {
        label: "Total Transaksi",
        value: transactions.length,
        icon: ShoppingBag,
      },
      {
        label: "Menunggu Bayar",
        value: waitingPayment,
        icon: Clock,
      },
      {
        label: "Diproses",
        value: processing,
        icon: Package,
      },
      {
        label: "Dikirim",
        value: shipped,
        icon: Truck,
      },
      {
        label: "Selesai",
        value: finished,
        icon: CheckCircle2,
      },
      {
        label: "Dibatalkan",
        value: cancelled,
        icon: XCircle,
      },
      {
        label: "Nilai Transaksi Aktif",
        value: formatIDR(activeGross),
        icon: ShoppingBag,
      },
    ];
  }, [transactions]);

  function handleApplyFilter() {
    loadTransactions();
  }

  function handleResetFilter() {
    setSearch("");
    setOrderStatus("");
    setPaymentStatus("");

    setTimeout(() => {
      loadTransactions();
    }, 0);
  }

  async function handleUpdateOrderStatus(
    transaction: AdminTransaction,
    nextStatus: string,
  ) {
    if (!nextStatus || nextStatus === transaction.order_status) return;

    const confirmed = window.confirm(
      `Ubah status order menjadi "${orderStatusLabel(nextStatus)}"?`,
    );

    if (!confirmed) return;

    setUpdatingId(`${transaction.id}:order`);

    try {
      await updateAdminOrderStatus({
        orderId: transaction.id,
        orderStatus: nextStatus,
      });

      toast.success("Status order berhasil diperbarui.");
      await loadTransactions();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status order.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleUpdatePaymentStatus(
    transaction: AdminTransaction,
    nextStatus: string,
  ) {
    if (!nextStatus || nextStatus === transaction.payment_status) return;

    const confirmed = window.confirm(
      `Ubah status pembayaran menjadi "${paymentStatusLabel(nextStatus)}"?`,
    );

    if (!confirmed) return;

    setUpdatingId(`${transaction.id}:payment`);

    try {
      await updateAdminPaymentStatus({
        orderId: transaction.id,
        paymentStatus: nextStatus,
      });

      toast.success("Status pembayaran berhasil diperbarui.");
      await loadTransactions();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status pembayaran.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkPaid(transaction: AdminTransaction) {
    setUpdatingId(`${transaction.id}:paid`);

    try {
      await updateAdminPaymentStatus({
        orderId: transaction.id,
        paymentStatus: "dibayar",
      });

      toast.success("Transaksi berhasil ditandai dibayar.");
      await loadTransactions();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menandai transaksi sebagai dibayar.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCancel(transaction: AdminTransaction) {
    const reason = window.prompt(
      "Masukkan alasan pembatalan transaksi:",
      "Dibatalkan oleh admin.",
    );

    if (reason === null) return;

    setUpdatingId(`${transaction.id}:cancel`);

    try {
      await cancelAdminTransaction({
        orderId: transaction.id,
        reason,
      });

      toast.success("Transaksi berhasil dibatalkan.");
      await loadTransactions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membatalkan transaksi.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRestoreStock(transaction: AdminTransaction) {
    const confirmed = window.confirm(
      "Kembalikan stok produk dari transaksi ini? Aksi ini tidak boleh dilakukan berulang.",
    );

    if (!confirmed) return;

    setUpdatingId(`${transaction.id}:restore`);

    try {
      await restoreAdminTransactionStock(transaction.id);

      toast.success("Stok transaksi berhasil dikembalikan.");
      await loadTransactions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal restore stok transaksi.",
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
              <h1 className="text-3xl font-bold">Monitoring Transaksi</h1>

              <p className="mt-1 text-muted-foreground">
                Pantau transaksi buyer dan seller, status pembayaran, status
                order, resi, pembatalan, dan restore stok.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/dashboard/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard Admin
                </a>
              </Button>

              <Button
                variant="outline"
                onClick={loadTransactions}
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

          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-7">
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

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleApplyFilter();
                    }
                  }}
                  placeholder="Cari order, pembeli, penjual, produk, atau resi..."
                  className="pl-9"
                />
              </div>

              <select
                value={orderStatus}
                onChange={(event) => setOrderStatus(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {orderStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <Button onClick={handleApplyFilter} disabled={loading}>
                Terapkan
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilter}
                disabled={loading}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-primary" />

                <h3 className="mt-4 text-lg font-semibold">
                  Transaksi tidak ditemukan
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Coba ubah filter atau refresh data transaksi.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    updatingId={updatingId}
                    onOrderStatusChange={handleUpdateOrderStatus}
                    onPaymentStatusChange={handleUpdatePaymentStatus}
                    onMarkPaid={handleMarkPaid}
                    onCancel={handleCancel}
                    onRestoreStock={handleRestoreStock}
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

function TransactionCard({
  transaction,
  updatingId,
  onOrderStatusChange,
  onPaymentStatusChange,
  onMarkPaid,
  onCancel,
  onRestoreStock,
}: {
  transaction: AdminTransaction;
  updatingId: string | null;
  onOrderStatusChange: (transaction: AdminTransaction, nextStatus: string) => void;
  onPaymentStatusChange: (
    transaction: AdminTransaction,
    nextStatus: string,
  ) => void;
  onMarkPaid: (transaction: AdminTransaction) => void;
  onCancel: (transaction: AdminTransaction) => void;
  onRestoreStock: (transaction: AdminTransaction) => void;
}) {
  const isUpdating = updatingId?.startsWith(transaction.id) ?? false;
  const isCancelled = transaction.order_status === "dibatalkan";
  const isFinished = ["pesanan_diterima", "selesai"].includes(
    transaction.order_status,
  );
  const isPaid = ["dibayar", "pembayaran_berhasil"].includes(
    transaction.payment_status,
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="text-xs text-muted-foreground">Order ID</div>

          <div className="mt-1 font-mono text-xs font-semibold md:text-sm">
            {transaction.id}
          </div>

          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <Info label="Pembeli" value={transaction.buyer_name} />
            <Info label="Penjual" value={transaction.seller_name} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={transaction.order_status} />
          <PaymentStatusBadge status={transaction.payment_status} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-3 font-semibold">Produk Dibeli</div>

          <div className="space-y-3">
            {transaction.order_items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Tidak ada item.
              </div>
            ) : (
              transaction.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border p-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                    <a
                      href={`/detail-produk?id=${item.product_id}`}
                      className="line-clamp-1 font-medium hover:text-primary"
                    >
                      {item.product_title}
                    </a>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.quantity} x {formatIDR(item.price)}
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {formatIDR(item.line_total)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-accent p-4">
            <div className="font-semibold">Ringkasan Transaksi</div>

            <div className="mt-3 grid gap-2 text-sm">
              <Info
                label="Metode Pembayaran"
                value={paymentMethodLabel(transaction.payment_method)}
              />

              <Info
                label="Metode Pengiriman"
                value={shippingMethodLabel(transaction.shipping_method)}
              />

              <Info label="Ongkir" value={formatIDR(transaction.shipping_cost)} />

              <Info label="Subtotal" value={formatIDR(transaction.subtotal)} />

              <Info label="Total" value={formatIDR(transaction.total)} strong />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="font-semibold">Pengiriman & Stok</div>

            <div className="mt-3 grid gap-2 text-sm">
              <Info label="Kurir" value={transaction.courier || "-"} />
              <Info label="Nomor Resi" value={transaction.tracking_number || "-"} />
              <Info
                label="Dikirim Pada"
                value={
                  transaction.shipped_at
                    ? new Date(transaction.shipped_at).toLocaleString("id-ID")
                    : "-"
                }
              />
              <Info
                label="Stok Dikembalikan"
                value={transaction.stock_restored ? "Ya" : "Belum"}
              />
            </div>
          </div>

          {isCancelled ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950">
              <div className="font-semibold">Pembatalan</div>

              <div className="mt-3 grid gap-2 text-sm">
                <Info label="Alasan" value={transaction.cancel_reason || "-"} />

                <Info
                  label="Dibatalkan Pada"
                  value={
                    transaction.cancelled_at
                      ? new Date(transaction.cancelled_at).toLocaleString("id-ID")
                      : "-"
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-3">
        <Info
          label="Dibuat"
          value={new Date(transaction.created_at).toLocaleString("id-ID")}
        />

        <Info
          label="Diperbarui"
          value={
            transaction.updated_at
              ? new Date(transaction.updated_at).toLocaleString("id-ID")
              : "-"
          }
        />

        <Info label="Alamat" value={transaction.shipping_address || "-"} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <div className="font-semibold">Kontrol Admin</div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
          <select
            value={transaction.order_status}
            onChange={(event) =>
              onOrderStatusChange(transaction, event.target.value)
            }
            disabled={isUpdating}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {orderActionOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={transaction.payment_status}
            onChange={(event) =>
              onPaymentStatusChange(transaction, event.target.value)
            }
            disabled={isUpdating}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {paymentActionOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {!isPaid ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onMarkPaid(transaction)}
              disabled={isUpdating}
            >
              {updatingId === `${transaction.id}:paid` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Tandai Dibayar
            </Button>
          ) : null}

          {!isCancelled && !isFinished ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onCancel(transaction)}
              disabled={isUpdating}
            >
              {updatingId === `${transaction.id}:cancel` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Batalkan
            </Button>
          ) : null}

          {isCancelled && !transaction.stock_restored ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onRestoreStock(transaction)}
              disabled={isUpdating}
            >
              {updatingId === `${transaction.id}:restore` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restore Stok
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string | null }) {
  const rawStatus = String(status ?? "");

  const className =
    {
      menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
      menunggu_konfirmasi_penjual: "bg-blue-100 text-blue-800",
      diproses_penjual: "bg-blue-100 text-blue-800",
      dikirim: "bg-purple-100 text-purple-800",
      pesanan_diterima: "bg-green-100 text-green-800",
      selesai: "bg-green-100 text-green-800",
      dibatalkan: "bg-red-100 text-red-800",
    }[rawStatus] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {orderStatusLabel(rawStatus)}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string | null }) {
  const rawStatus = String(status ?? "");

  const className =
    {
      menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
      pembayaran_diproses: "bg-blue-100 text-blue-800",
      pembayaran_berhasil: "bg-green-100 text-green-800",
      dibayar: "bg-green-100 text-green-800",
      pembayaran_gagal: "bg-red-100 text-red-800",
      gagal: "bg-red-100 text-red-800",
      dikembalikan: "bg-slate-100 text-slate-700",
      kedaluwarsa: "bg-slate-100 text-slate-700",
    }[rawStatus] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {paymentStatusLabel(rawStatus)}
    </span>
  );
}

function Info({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
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