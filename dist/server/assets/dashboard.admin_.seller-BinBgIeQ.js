import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { Store, CheckCircle2, UserX, Package, ShoppingBag, ArrowLeft, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getAdminSellers(filters = {}) {
  const { data, error } = await db.rpc("get_admin_sellers", {
    p_search: emptyToNull(filters.search),
    p_status: emptyToNull(filters.status),
    p_limit: filters.limit ?? 300
  });
  if (error) {
    throw new Error(
      error.message.includes("get_admin_sellers") ? "RPC get_admin_sellers belum tersedia. Jalankan migration SQL fitur admin terlebih dahulu." : error.message
    );
  }
  return (data ?? []).map((row) => ({
    seller_id: String(row.seller_id ?? ""),
    email: String(row.email ?? ""),
    full_name: String(row.full_name ?? ""),
    shop_name: String(row.shop_name ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    city: String(row.city ?? ""),
    shop_location: String(row.shop_location ?? ""),
    is_active: row.is_active === null || row.is_active === void 0 ? true : Boolean(row.is_active),
    total_products: Number(row.total_products ?? 0),
    active_products: Number(row.active_products ?? 0),
    pending_products: Number(row.pending_products ?? 0),
    rejected_products: Number(row.rejected_products ?? 0),
    inactive_products: Number(row.inactive_products ?? 0),
    total_orders: Number(row.total_orders ?? 0),
    completed_orders: Number(row.completed_orders ?? 0),
    cancelled_orders: Number(row.cancelled_orders ?? 0),
    gross_revenue: Number(row.gross_revenue ?? 0),
    created_at: String(row.created_at ?? "")
  }));
}
async function setAdminSellerActiveStatus({
  sellerId,
  isActive
}) {
  const cleanSellerId = String(sellerId ?? "").trim();
  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }
  const { data, error } = await db.rpc("set_admin_user_active_status", {
    p_user_id: cleanSellerId,
    p_is_active: isActive
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
function emptyToNull(value) {
  const clean = String(value ?? "").trim();
  return clean ? clean : null;
}
function formatIDR(value) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return "Rp 0";
  }
  return "Rp " + new Intl.NumberFormat("id-ID").format(numberValue);
}
function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
}
const statusOptions = [{
  value: "",
  label: "Semua Status"
}, {
  value: "active",
  label: "Aktif"
}, {
  value: "inactive",
  label: "Nonaktif"
}];
function AdminSellerPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  async function loadSellers(next) {
    setLoading(true);
    try {
      const rows = await getAdminSellers({
        search: next?.search ?? search,
        status: next?.status ?? status,
        limit: 300
      });
      setSellers(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data seller.");
      console.error("[Load Admin Sellers Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadSellers({
      search: "",
      status: ""
    });
  }, []);
  const stats = useMemo(() => {
    return [{
      label: "Total Seller",
      value: sellers.length,
      icon: Store
    }, {
      label: "Seller Aktif",
      value: sellers.filter((item) => item.is_active).length,
      icon: CheckCircle2
    }, {
      label: "Seller Nonaktif",
      value: sellers.filter((item) => !item.is_active).length,
      icon: UserX
    }, {
      label: "Total Produk",
      value: sellers.reduce((sum, item) => sum + item.total_products, 0),
      icon: Package
    }, {
      label: "Total Order",
      value: sellers.reduce((sum, item) => sum + item.total_orders, 0),
      icon: ShoppingBag
    }, {
      label: "Omzet Seller",
      value: formatIDR(sellers.reduce((sum, item) => sum + item.gross_revenue, 0)),
      icon: ShoppingBag
    }];
  }, [sellers]);
  function handleReset() {
    setSearch("");
    setStatus("");
    loadSellers({
      search: "",
      status: ""
    });
  }
  async function handleToggleStatus(seller) {
    const nextStatus = !seller.is_active;
    const confirmed = window.confirm(nextStatus ? `Aktifkan seller ${seller.shop_name || seller.full_name || seller.email}?` : `Nonaktifkan seller ${seller.shop_name || seller.full_name || seller.email}?`);
    if (!confirmed) return;
    setUpdatingId(seller.seller_id);
    try {
      await setAdminSellerActiveStatus({
        sellerId: seller.seller_id,
        isActive: nextStatus
      });
      toast.success(nextStatus ? "Seller berhasil diaktifkan." : "Seller berhasil dinonaktifkan.");
      await loadSellers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status seller.");
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Monitoring Seller" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau toko seller, produk aktif, transaksi seller, dan performa masing-masing seller." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Admin"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => loadSellers(), disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsx(stat.icon, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 text-2xl font-bold", children: stat.value }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: stat.label })
      ] }, stat.label)) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 lg:grid-cols-[1.5fr_1fr_auto_auto]", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), onKeyDown: (event) => {
            if (event.key === "Enter") loadSellers();
          }, placeholder: "Cari toko, nama seller, email, WhatsApp, atau kota...", className: "pl-9" })
        ] }),
        /* @__PURE__ */ jsx("select", { value: status, onChange: (event) => setStatus(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: statusOptions.map((item) => /* @__PURE__ */ jsx("option", { value: item.value, children: item.label }, item.value)) }),
        /* @__PURE__ */ jsx(Button, { type: "button", onClick: () => loadSellers(), children: "Terapkan" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleReset, children: "Reset" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : sellers.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(Store, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Seller tidak ditemukan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Coba ubah filter atau kata kunci pencarian." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: sellers.map((seller) => /* @__PURE__ */ jsx(SellerCard, { seller, updating: updatingId === seller.seller_id, onToggleStatus: () => handleToggleStatus(seller) }, seller.seller_id)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function SellerCard({
  seller,
  updating,
  onToggleStatus
}) {
  return /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: seller.shop_name || seller.full_name || "Toko tanpa nama" }),
        /* @__PURE__ */ jsx(StatusBadge, { active: seller.is_active })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
        seller.full_name || "-",
        " • ",
        seller.email || "-"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Info, { label: "WhatsApp", value: seller.whatsapp || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Lokasi", value: seller.shop_location || seller.city || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Tanggal Daftar", value: formatDateTime(seller.created_at) }),
        /* @__PURE__ */ jsx(Info, { label: "Seller ID", value: seller.seller_id })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 text-sm md:grid-cols-4 lg:min-w-[640px]", children: [
      /* @__PURE__ */ jsx(Info, { label: "Produk Total", value: seller.total_products }),
      /* @__PURE__ */ jsx(Info, { label: "Produk Aktif", value: seller.active_products }),
      /* @__PURE__ */ jsx(Info, { label: "Pending", value: seller.pending_products }),
      /* @__PURE__ */ jsx(Info, { label: "Ditolak", value: seller.rejected_products }),
      /* @__PURE__ */ jsx(Info, { label: "Order Total", value: seller.total_orders }),
      /* @__PURE__ */ jsx(Info, { label: "Order Selesai", value: seller.completed_orders }),
      /* @__PURE__ */ jsx(Info, { label: "Order Batal", value: seller.cancelled_orders }),
      /* @__PURE__ */ jsx(Info, { label: "Omzet", value: formatIDR(seller.gross_revenue) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: seller.is_active ? "destructive" : "default", disabled: updating, onClick: onToggleStatus, children: [
      updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : seller.is_active ? /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
      seller.is_active ? "Nonaktifkan" : "Aktifkan"
    ] }) })
  ] }) });
}
function StatusBadge({
  active
}) {
  return active ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800", children: "Aktif" }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800", children: "Nonaktif" });
}
function Info({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "break-words font-medium", children: value || "-" })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "admin", children: /* @__PURE__ */ jsx(AdminSellerPage, {}) });
export {
  SplitComponent as component
};
