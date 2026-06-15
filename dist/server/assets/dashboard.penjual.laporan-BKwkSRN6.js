import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { s as supabase, u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { BarChart3, ShoppingBag, CheckCircle2, Clock, Truck, XCircle, Package, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getSellerSalesReport(filters) {
  const sellerId = String(filters.sellerId ?? "").trim();
  if (!sellerId || sellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }
  const startDate = filters.startDate ? `${filters.startDate}T00:00:00.000Z` : null;
  const endDate = filters.endDate ? `${filters.endDate}T23:59:59.999Z` : null;
  let query = db.from("orders").select(
    `
      id,
      buyer_id,
      order_status,
      payment_status,
      payment_method,
      shipping_method,
      subtotal,
      shipping_cost,
      total,
      courier,
      tracking_number,
      created_at,
      updated_at,
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
    `
  ).eq("seller_id", sellerId).order("created_at", { ascending: false });
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const rows = data ?? [];
  const transactions = rows.map((order) => {
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    return {
      id: order.id,
      buyer_id: order.buyer_id ?? null,
      order_status: String(order.order_status ?? ""),
      payment_status: String(order.payment_status ?? ""),
      payment_method: order.payment_method ?? null,
      shipping_method: order.shipping_method ?? null,
      subtotal: Number(order.subtotal ?? 0),
      shipping_cost: Number(order.shipping_cost ?? 0),
      total: Number(order.total ?? 0),
      courier: order.courier ?? null,
      tracking_number: order.tracking_number ?? null,
      created_at: order.created_at,
      updated_at: order.updated_at ?? null,
      order_items: orderItems.map((item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const quantity = Number(item.quantity ?? 0);
        const price = Number(item.price ?? 0);
        return {
          id: item.id,
          product_id: item.product_id,
          product_title: product?.title ?? "Produk",
          product_image: product?.images?.[0] ?? null,
          quantity,
          price,
          line_total: quantity * price
        };
      })
    };
  });
  const completedOrders = transactions.filter(
    (order) => order.order_status === "selesai" && order.payment_status === "dibayar"
  );
  const processingOrders = transactions.filter(
    (order) => ["menunggu_konfirmasi_penjual", "diproses_penjual"].includes(
      order.order_status
    )
  );
  const shippedOrders = transactions.filter(
    (order) => order.order_status === "dikirim"
  );
  const cancelledOrders = transactions.filter(
    (order) => order.order_status === "dibatalkan"
  );
  const paidOrders = transactions.filter(
    (order) => order.payment_status === "dibayar"
  );
  const grossRevenue = paidOrders.filter((order) => order.order_status !== "dibatalkan").reduce((sum, order) => sum + Number(order.total), 0);
  const completedRevenue = completedOrders.reduce((sum, order) => {
    return sum + Number(order.total);
  }, 0);
  const cancelledValue = cancelledOrders.reduce((sum, order) => {
    return sum + Number(order.total);
  }, 0);
  const totalUnitsSold = completedOrders.reduce((sum, order) => {
    return sum + order.order_items.reduce((itemSum, item) => {
      return itemSum + Number(item.quantity);
    }, 0);
  }, 0);
  const topProductMap = /* @__PURE__ */ new Map();
  completedOrders.forEach((order) => {
    order.order_items.forEach((item) => {
      const current = topProductMap.get(item.product_id);
      if (current) {
        current.quantity_sold += Number(item.quantity);
        current.revenue += Number(item.line_total);
      } else {
        topProductMap.set(item.product_id, {
          product_id: item.product_id,
          product_title: item.product_title,
          product_image: item.product_image,
          quantity_sold: Number(item.quantity),
          revenue: Number(item.line_total)
        });
      }
    });
  });
  const topProducts = Array.from(topProductMap.values()).sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 10);
  const dailySales = buildDailySales({
    startDate: filters.startDate,
    endDate: filters.endDate,
    completedOrders
  });
  return {
    summary: {
      total_orders: transactions.length,
      completed_orders: completedOrders.length,
      processing_orders: processingOrders.length,
      shipped_orders: shippedOrders.length,
      cancelled_orders: cancelledOrders.length,
      paid_orders: paidOrders.length,
      total_units_sold: totalUnitsSold,
      gross_revenue: grossRevenue,
      completed_revenue: completedRevenue,
      cancelled_value: cancelledValue
    },
    daily_sales: dailySales,
    top_products: topProducts,
    transactions
  };
}
function buildDailySales({
  startDate,
  endDate,
  completedOrders
}) {
  const start = /* @__PURE__ */ new Date(`${startDate}T00:00:00`);
  const end = /* @__PURE__ */ new Date(`${endDate}T00:00:00`);
  const map = /* @__PURE__ */ new Map();
  const current = new Date(start);
  while (current <= end) {
    const dateKey = toDateKey(current);
    map.set(dateKey, {
      date: dateKey,
      label: formatShortDate(dateKey),
      revenue: 0,
      orders: 0,
      units: 0
    });
    current.setDate(current.getDate() + 1);
  }
  completedOrders.forEach((order) => {
    const dateKey = String(order.created_at).slice(0, 10);
    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: dateKey,
        label: formatShortDate(dateKey),
        revenue: 0,
        orders: 0,
        units: 0
      });
    }
    const row = map.get(dateKey);
    if (!row) return;
    row.revenue += Number(order.total);
    row.orders += 1;
    row.units += order.order_items.reduce((sum, item) => {
      return sum + Number(item.quantity);
    }, 0);
  });
  return Array.from(map.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatShortDate(date) {
  const parsed = /* @__PURE__ */ new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short"
  });
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
function orderStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    diproses_penjual: "Diproses Penjual",
    dikirim: "Dikirim",
    pesanan_diterima: "Pesanan Diterima",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan"
  };
  if (!status) return "-";
  return labels[status] ?? status;
}
function paymentStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan"
  };
  if (!status) return "-";
  return labels[status] ?? status;
}
function getTodayDate() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function getThirtyDaysAgoDate() {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}
function SellerSalesReportPage() {
  const {
    user
  } = useAuth();
  const [startDate, setStartDate] = useState(getThirtyDaysAgoDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [report, setReport] = useState(null);
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
        endDate
      });
      setReport(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat laporan penjualan.");
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
    return [{
      label: "Omzet Selesai",
      value: formatIDR(summary?.completed_revenue ?? 0),
      icon: BarChart3
    }, {
      label: "Total Order",
      value: String(summary?.total_orders ?? 0),
      icon: ShoppingBag
    }, {
      label: "Order Selesai",
      value: String(summary?.completed_orders ?? 0),
      icon: CheckCircle2
    }, {
      label: "Sedang Diproses",
      value: String(summary?.processing_orders ?? 0),
      icon: Clock
    }, {
      label: "Dikirim",
      value: String(summary?.shipped_orders ?? 0),
      icon: Truck
    }, {
      label: "Dibatalkan",
      value: String(summary?.cancelled_orders ?? 0),
      icon: XCircle
    }, {
      label: "Produk Terjual",
      value: String(summary?.total_units_sold ?? 0),
      icon: Package
    }];
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
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Laporan Penjualan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau omzet, grafik penjualan, produk paling laku, dan riwayat transaksi toko kamu." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual", children: "Dashboard Penjual" }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadReport, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Tanggal Awal" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: startDate, onChange: (event) => setStartDate(event.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Tanggal Akhir" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: endDate, onChange: (event) => setEndDate(event.target.value) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(Button, { type: "button", onClick: handleApplyFilter, disabled: loading, className: "w-full", children: "Terapkan" }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleResetFilter, disabled: loading, className: "w-full", children: "Reset" }) })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : !report ? /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Laporan belum tersedia" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Coba refresh atau ubah rentang tanggal." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-7", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsx(stat.icon, { className: "h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 text-xl font-bold", children: stat.value }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: stat.label })
        ] }, stat.label)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(SalesChart, { data: report.daily_sales }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]", children: [
          /* @__PURE__ */ jsx(TopProductsCard, { products: report.top_products }),
          /* @__PURE__ */ jsx(TransactionList, { transactions: report.transactions })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function SalesChart({
  data
}) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
  const totalUnits = data.reduce((sum, item) => sum + item.units, 0);
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Grafik Penjualan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Grafik omzet harian berdasarkan order yang sudah selesai." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2 text-right text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Omzet: " }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatIDR(totalRevenue) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Order: " }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: totalOrders })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Produk: " }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: totalUnits })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 overflow-x-auto rounded-xl border border-border bg-background p-4", children: /* @__PURE__ */ jsx("div", { className: "flex h-72 min-w-[720px] items-end gap-3", children: data.map((item) => {
      const height = Math.max(item.revenue / maxRevenue * 220, 8);
      return /* @__PURE__ */ jsxs("div", { className: "flex min-w-14 flex-1 flex-col items-center justify-end gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-medium text-muted-foreground", children: item.revenue > 0 ? formatCompactIDR(item.revenue) : "0" }),
        /* @__PURE__ */ jsx("div", { className: "w-full rounded-t-xl bg-primary/80 transition hover:bg-primary", style: {
          height
        }, title: `${item.label} | ${formatIDR(item.revenue)} | ${item.orders} order | ${item.units} produk` }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: item.label })
      ] }, item.date);
    }) }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-xs text-muted-foreground", children: "Arahkan cursor ke batang grafik untuk melihat detail omzet, order, dan jumlah produk terjual." })
  ] });
}
function TopProductsCard({
  products
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Produk Paling Laku" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Berdasarkan order selesai dalam periode terpilih." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: [
      /* @__PURE__ */ jsx(Package, { className: "mx-auto h-9 w-9 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 font-semibold", children: "Belum ada produk terjual" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Produk akan muncul setelah order selesai." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: products.map((product, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border p-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary", children: index + 1 }),
      /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted", children: product.product_image ? /* @__PURE__ */ jsx("img", { src: product.product_image, alt: product.product_title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: product.product_title }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          product.quantity_sold,
          " terjual"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-right text-sm font-semibold", children: formatIDR(product.revenue) })
    ] }, product.product_id)) }) })
  ] });
}
function TransactionList({
  transactions
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Riwayat Transaksi" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Semua transaksi toko dalam periode terpilih." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: transactions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: [
      /* @__PURE__ */ jsx(ShoppingBag, { className: "mx-auto h-9 w-9 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 font-semibold", children: "Belum ada transaksi" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Transaksi akan muncul setelah buyer membuat order." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: transactions.map((transaction) => /* @__PURE__ */ jsx(TransactionCard, { transaction }, transaction.id)) }) })
  ] });
}
function TransactionCard({
  transaction
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-xs font-semibold", children: transaction.id }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: new Date(transaction.created_at).toLocaleString("id-ID") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(OrderStatusBadge, { status: transaction.order_status }),
        /* @__PURE__ */ jsx(PaymentStatusBadge, { status: transaction.payment_status })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: transaction.order_items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted", children: item.product_image ? /* @__PURE__ */ jsx("img", { src: item.product_image, alt: item.product_title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "line-clamp-1 text-sm font-medium", children: item.product_title }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          item.quantity,
          " x ",
          formatIDR(item.price)
        ] })
      ] })
    ] }, item.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2 border-t border-border pt-4 text-sm md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Info, { label: "Subtotal", value: formatIDR(transaction.subtotal) }),
      /* @__PURE__ */ jsx(Info, { label: "Ongkir", value: formatIDR(transaction.shipping_cost) }),
      /* @__PURE__ */ jsx(Info, { label: "Total", value: formatIDR(transaction.total), strong: true }),
      /* @__PURE__ */ jsx(Info, { label: "Resi", value: transaction.tracking_number ? `${transaction.courier || "-"} - ${transaction.tracking_number}` : "-" })
    ] })
  ] });
}
function OrderStatusBadge({
  status
}) {
  const className = {
    menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
    menunggu_konfirmasi_penjual: "bg-blue-100 text-blue-800",
    diproses_penjual: "bg-blue-100 text-blue-800",
    dikirim: "bg-purple-100 text-purple-800",
    pesanan_diterima: "bg-green-100 text-green-800",
    selesai: "bg-green-100 text-green-800",
    dibatalkan: "bg-red-100 text-red-800"
  }[status] ?? "bg-slate-100 text-slate-700";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${className}`, children: orderStatusLabel(status) });
}
function PaymentStatusBadge({
  status
}) {
  const className = {
    menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
    dibayar: "bg-green-100 text-green-800",
    gagal: "bg-red-100 text-red-800",
    dikembalikan: "bg-slate-100 text-slate-700"
  }[status] ?? "bg-slate-100 text-slate-700";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${className}`, children: paymentStatusLabel(status) });
}
function Info({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: strong ? "font-bold text-primary" : "font-medium", children: value })
  ] });
}
function formatCompactIDR(value) {
  if (value >= 1e6) {
    return `${Math.round(value / 1e6)}jt`;
  }
  if (value >= 1e3) {
    return `${Math.round(value / 1e3)}rb`;
  }
  return String(value);
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerSalesReportPage, {}) });
export {
  SplitComponent as component
};
