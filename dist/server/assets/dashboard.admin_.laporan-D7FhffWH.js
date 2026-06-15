import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { Users, Store, Package, CheckCircle2, ShoppingBag, XCircle, BarChart3, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getAdminMarketplaceReport(filters = {}) {
  const { data, error } = await db.rpc("get_admin_marketplace_report", {
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null
  });
  if (error) {
    throw new Error(
      error.message.includes("get_admin_marketplace_report") ? "RPC get_admin_marketplace_report belum tersedia. Jalankan migration SQL fitur admin terlebih dahulu." : error.message
    );
  }
  const report = Array.isArray(data) ? data[0] : data;
  return {
    summary: {
      total_users: Number(report?.summary?.total_users ?? 0),
      total_buyers: Number(report?.summary?.total_buyers ?? 0),
      total_sellers: Number(report?.summary?.total_sellers ?? 0),
      total_products: Number(report?.summary?.total_products ?? 0),
      approved_products: Number(report?.summary?.approved_products ?? 0),
      pending_products: Number(report?.summary?.pending_products ?? 0),
      total_orders: Number(report?.summary?.total_orders ?? 0),
      completed_orders: Number(report?.summary?.completed_orders ?? 0),
      cancelled_orders: Number(report?.summary?.cancelled_orders ?? 0),
      gross_revenue: Number(report?.summary?.gross_revenue ?? 0),
      cancelled_value: Number(report?.summary?.cancelled_value ?? 0)
    },
    top_products: Array.isArray(report?.top_products) ? report.top_products.map((item) => ({
      product_id: String(item.product_id ?? ""),
      product_title: String(item.product_title ?? "Produk"),
      product_image: item.product_image ? String(item.product_image) : null,
      quantity_sold: Number(item.quantity_sold ?? 0),
      revenue: Number(item.revenue ?? 0)
    })) : [],
    top_sellers: Array.isArray(report?.top_sellers) ? report.top_sellers.map((item) => ({
      seller_id: String(item.seller_id ?? ""),
      seller_name: String(item.seller_name ?? "Seller"),
      email: String(item.email ?? ""),
      order_count: Number(item.order_count ?? 0),
      revenue: Number(item.revenue ?? 0)
    })) : [],
    daily_sales: Array.isArray(report?.daily_sales) ? report.daily_sales.map((item) => ({
      date: String(item.date ?? ""),
      label: String(item.label ?? ""),
      orders: Number(item.orders ?? 0),
      revenue: Number(item.revenue ?? 0)
    })) : []
  };
}
function formatIDR(value) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return "Rp 0";
  }
  return "Rp " + new Intl.NumberFormat("id-ID").format(numberValue);
}
function getToday() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function getDateDaysAgo(days) {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
function AdminMarketplaceReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(getToday());
  async function loadReport(next) {
    setLoading(true);
    try {
      const rows = await getAdminMarketplaceReport({
        startDate: next?.startDate ?? startDate,
        endDate: next?.endDate ?? endDate
      });
      setReport(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat laporan marketplace.");
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
    return [{
      label: "Total User",
      value: summary?.total_users ?? 0,
      icon: Users
    }, {
      label: "Total Seller",
      value: summary?.total_sellers ?? 0,
      icon: Store
    }, {
      label: "Total Produk",
      value: summary?.total_products ?? 0,
      icon: Package
    }, {
      label: "Produk Approved",
      value: summary?.approved_products ?? 0,
      icon: CheckCircle2
    }, {
      label: "Total Transaksi",
      value: summary?.total_orders ?? 0,
      icon: ShoppingBag
    }, {
      label: "Transaksi Selesai",
      value: summary?.completed_orders ?? 0,
      icon: CheckCircle2
    }, {
      label: "Transaksi Batal",
      value: summary?.cancelled_orders ?? 0,
      icon: XCircle
    }, {
      label: "Omzet Aktif",
      value: formatIDR(summary?.gross_revenue ?? 0),
      icon: BarChart3
    }];
  }, [report]);
  function handleReset() {
    const nextStartDate = getDateDaysAgo(30);
    const nextEndDate = getToday();
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    loadReport({
      startDate: nextStartDate,
      endDate: nextEndDate
    });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Laporan Marketplace" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Lihat ringkasan transaksi, omzet marketplace, produk terjual, seller aktif, dan pembatalan." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Admin"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => loadReport(), disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1 text-sm text-muted-foreground", children: "Tanggal Mulai" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: startDate, onChange: (event) => setStartDate(event.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1 text-sm text-muted-foreground", children: "Tanggal Selesai" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: endDate, onChange: (event) => setEndDate(event.target.value) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(Button, { type: "button", onClick: () => loadReport(), disabled: loading, className: "w-full", children: "Terapkan" }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleReset, disabled: loading, className: "w-full", children: "Reset" }) })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-4", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsx(stat.icon, { className: "h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 text-2xl font-bold", children: stat.value }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: stat.label })
        ] }, stat.label)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 xl:grid-cols-2", children: [
          /* @__PURE__ */ jsx(ReportPanel, { title: "Produk Terlaris", children: report?.top_products.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: report.top_products.map((product, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary", children: index + 1 }),
            /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-accent", children: product.product_image ? /* @__PURE__ */ jsx("img", { src: product.product_image, alt: product.product_title, className: "h-full w-full object-cover" }) : null }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: product.product_title }),
              /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
                product.quantity_sold,
                " terjual •",
                " ",
                formatIDR(product.revenue)
              ] })
            ] })
          ] }, product.product_id)) }) : /* @__PURE__ */ jsx(EmptyText, { children: "Belum ada produk terjual pada periode ini." }) }),
          /* @__PURE__ */ jsx(ReportPanel, { title: "Seller Performa Tertinggi", children: report?.top_sellers.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: report.top_sellers.map((seller, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary", children: index + 1 }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: seller.seller_name }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: seller.email || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right text-sm", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: formatIDR(seller.revenue) }),
              /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
                seller.order_count,
                " order"
              ] })
            ] })
          ] }, seller.seller_id)) }) : /* @__PURE__ */ jsx(EmptyText, { children: "Belum ada seller dengan transaksi pada periode ini." }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(ReportPanel, { title: "Ringkasan Harian", children: report?.daily_sales.length ? /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border text-left", children: [
            /* @__PURE__ */ jsx("th", { className: "py-3 pr-4", children: "Tanggal" }),
            /* @__PURE__ */ jsx("th", { className: "py-3 pr-4", children: "Order" }),
            /* @__PURE__ */ jsx("th", { className: "py-3 pr-4", children: "Omzet" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: report.daily_sales.map((day) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 pr-4", children: day.label }),
            /* @__PURE__ */ jsx("td", { className: "py-3 pr-4", children: day.orders }),
            /* @__PURE__ */ jsx("td", { className: "py-3 pr-4 font-semibold", children: formatIDR(day.revenue) })
          ] }, day.date)) })
        ] }) }) : /* @__PURE__ */ jsx(EmptyText, { children: "Belum ada transaksi pada periode ini." }) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function ReportPanel({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: title }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children })
  ] });
}
function EmptyText({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "admin", children: /* @__PURE__ */ jsx(AdminMarketplaceReportPage, {}) });
export {
  SplitComponent as component
};
