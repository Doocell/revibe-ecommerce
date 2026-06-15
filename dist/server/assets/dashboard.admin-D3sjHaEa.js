import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { Users, Package, ShieldCheck, CreditCard, ShoppingBag, Loader2, RefreshCw, Bell, Store, MessageCircle, BarChart3, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
async function getAdminProducts(status) {
  let query = supabase.from("products").select("*, categories(id, name, slug)").order("created_at", { ascending: false });
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data: products, error } = await query;
  if (error) throw error;
  const rows = products ?? [];
  const sellerIds = Array.from(new Set(rows.map((product) => product.seller_id)));
  if (sellerIds.length === 0) {
    return [];
  }
  const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name, shop_name, whatsapp").in("id", sellerIds);
  if (profileError) throw profileError;
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  return rows.map((product) => ({
    ...product,
    seller: profileMap.get(product.seller_id) ?? null
  }));
}
async function updateProductStatus(productId, status) {
  const { data, error } = await supabase.from("products").update({
    status,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", productId).select("*, categories(id, name, slug)").single();
  if (error) throw error;
  return data;
}
const filters = [{
  value: "all",
  label: "Semua"
}, {
  value: "pending",
  label: "Menunggu"
}, {
  value: "approved",
  label: "Disetujui"
}, {
  value: "rejected",
  label: "Ditolak"
}, {
  value: "inactive",
  label: "Nonaktif"
}];
function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const menus = [{
    title: "Monitoring Transaksi",
    description: "Pantau semua transaksi buyer dan seller, status pembayaran, status order, resi, pembatalan, dan restore stok.",
    href: "/dashboard/admin/transaksi",
    icon: ShoppingBag,
    primary: true,
    status: "ready"
  }, {
    title: "Monitoring User",
    description: "Lihat akun buyer, seller, admin, status aktif/nonaktif, jumlah order, dan jumlah produk seller.",
    href: "/dashboard/admin/users",
    icon: Users,
    primary: true,
    status: "ready"
  }, {
    title: "Notifikasi Sistem",
    description: "Lihat notifikasi order, pembayaran, pengiriman, pembatalan, chat, dan aktivitas marketplace.",
    href: "/notifikasi",
    icon: Bell,
    status: "ready"
  }, {
    title: "Monitoring Seller",
    description: "Pantau toko seller, produk aktif, transaksi seller, dan performa masing-masing seller.",
    href: "/dashboard/admin/seller",
    icon: Store,
    status: "next"
  }, {
    title: "Monitoring Chat",
    description: "Pantau percakapan, laporan masalah, atau komplain antara buyer dan seller.",
    href: "/dashboard/admin/chat",
    icon: MessageCircle,
    status: "next"
  }, {
    title: "Laporan Marketplace",
    description: "Lihat ringkasan transaksi, omzet marketplace, produk terjual, seller aktif, dan pembatalan.",
    href: "/dashboard/admin/laporan",
    icon: BarChart3,
    status: "next"
  }];
  async function loadProducts() {
    setLoading(true);
    try {
      const rows = await getAdminProducts(filter);
      setProducts(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data produk admin.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadProducts();
  }, [filter]);
  const stats = useMemo(() => [{
    icon: Users,
    label: "Total Pengguna",
    value: "Lihat User",
    href: "/dashboard/admin/users"
  }, {
    icon: Package,
    label: "Produk Filter Ini",
    value: products.length
  }, {
    icon: ShieldCheck,
    label: "Menunggu Verifikasi",
    value: products.filter((product) => product.status === "pending").length
  }, {
    icon: CreditCard,
    label: "Transaksi",
    value: "Lihat Transaksi",
    href: "/dashboard/admin/transaksi"
  }], [products]);
  async function handleUpdateStatus(productId, status) {
    setUpdatingId(productId);
    try {
      await updateProductStatus(productId, status);
      setProducts((current) => current.map((product) => product.id === productId ? {
        ...product,
        status
      } : product).filter((product) => filter === "all" || product.status === filter));
      const message = {
        approved: "Produk berhasil disetujui dan akan tampil ke pembeli.",
        rejected: "Produk berhasil ditolak.",
        inactive: "Produk berhasil dinonaktifkan.",
        pending: "Produk dikembalikan ke status menunggu."
      }[status];
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status produk.");
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-3xl border border-border bg-card", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-primary/15 via-primary/5 to-background p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 md:flex-row md:items-center md:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4" }),
              "Admin Panel"
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-bold", children: "Dashboard Admin ReVibe" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-muted-foreground", children: "Kelola verifikasi produk, pantau transaksi, monitoring user, dan kontrol fitur utama marketplace." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin/transaksi", children: [
              /* @__PURE__ */ jsx(ShoppingBag, { className: "mr-2 h-4 w-4" }),
              "Monitoring Transaksi"
            ] }) }),
            /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin/users", children: [
              /* @__PURE__ */ jsx(Users, { className: "mr-2 h-4 w-4" }),
              "Monitoring User"
            ] }) }),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: loadProducts, disabled: loading, children: [
              loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
              "Refresh"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-4 border-t border-border p-6 md:grid-cols-4", children: stats.map((stat) => /* @__PURE__ */ jsx(AdminStatCard, { stat }, stat.label)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: menus.map((menu) => /* @__PURE__ */ jsx(AdminMenuCard, { menu }, menu.title)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-10 rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Verifikasi Produk" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Produk baru dari seller masuk ke status pending dan hanya tampil publik setelah disetujui admin." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: filters.map((item) => /* @__PURE__ */ jsx(Button, { type: "button", variant: filter === item.value ? "default" : "outline", onClick: () => setFilter(item.value), children: item.label }, item.value)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : products.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground", children: "Tidak ada produk pada status ini." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: products.map((product) => /* @__PURE__ */ jsx(AdminProductCard, { product, updating: updatingId === product.id, onApprove: () => handleUpdateStatus(product.id, "approved"), onReject: () => handleUpdateStatus(product.id, "rejected"), onInactive: () => handleUpdateStatus(product.id, "inactive") }, product.id)) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border bg-accent/40 p-5 text-sm text-muted-foreground", children: [
        "Catatan: tombol ",
        /* @__PURE__ */ jsx("b", { children: "Setujui" }),
        " mengubah status produk menjadi",
        " ",
        /* @__PURE__ */ jsx("b", { children: "approved" }),
        ". Setelah itu produk akan muncul di halaman",
        " ",
        /* @__PURE__ */ jsx("b", { children: "/produk" }),
        " karena halaman produk hanya mengambil data dengan status approved."
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function AdminStatCard({
  stat
}) {
  const content = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(stat.icon, { className: "h-6 w-6 text-primary" }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-2xl font-bold", children: stat.value }),
    /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: stat.label })
  ] });
  const className = "rounded-2xl border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-sm";
  if (stat.href) {
    return /* @__PURE__ */ jsx("a", { href: stat.href, className, children: content });
  }
  return /* @__PURE__ */ jsx("div", { className, children: content });
}
function AdminMenuCard({
  menu
}) {
  return /* @__PURE__ */ jsx("a", { href: menu.href, className: `group rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-md ${menu.primary ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: `rounded-2xl p-3 ${menu.primary ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`, children: /* @__PURE__ */ jsx(menu.icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold group-hover:text-primary", children: menu.title }),
        menu.status === "ready" ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800", children: "Siap" }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800", children: "Berikutnya" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-muted-foreground", children: menu.description }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm font-medium text-primary", children: "Buka fitur →" })
    ] })
  ] }) });
}
function AdminProductCard({
  product,
  updating,
  onApprove,
  onReject,
  onInactive
}) {
  const image = product.images?.[0];
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-[120px_1fr_auto]", children: [
    /* @__PURE__ */ jsx("div", { className: "h-28 w-full overflow-hidden rounded-xl bg-accent md:w-28", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: product.title }),
        /* @__PURE__ */ jsx(StatusBadge, { status: product.status })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: product.description || "Tidak ada deskripsi." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-1 text-sm text-muted-foreground md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Harga:",
          " ",
          /* @__PURE__ */ jsxs("b", { className: "text-foreground", children: [
            "Rp ",
            Number(product.price).toLocaleString("id-ID")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Stok: ",
          product.stock
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Kategori: ",
          product.categories?.name ?? "Tanpa kategori"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Kondisi: ",
          conditionLabel(product.condition)
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Lokasi: ",
          product.location ?? "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Seller:",
          " ",
          product.seller?.shop_name || product.seller?.full_name || product.seller_id
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 md:w-40 md:flex-col", children: [
      product.status !== "approved" ? /* @__PURE__ */ jsxs(Button, { onClick: onApprove, disabled: updating, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
        "Setujui"
      ] }) : null,
      product.status === "pending" ? /* @__PURE__ */ jsxs(Button, { variant: "destructive", onClick: onReject, disabled: updating, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }),
        "Tolak"
      ] }) : null,
      product.status === "approved" ? /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: onInactive, disabled: updating, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "mr-2 h-4 w-4" }),
        "Nonaktifkan"
      ] }) : null
    ] })
  ] });
}
function StatusBadge({
  status
}) {
  const label = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    inactive: "Nonaktif"
  }[status];
  const className = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    inactive: "bg-slate-100 text-slate-700"
  }[status];
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-1 text-xs font-medium ${className}`, children: label });
}
function conditionLabel(condition) {
  return {
    like_new: "Seperti baru",
    very_good: "Sangat baik",
    good: "Baik",
    fair: "Cukup"
  }[condition];
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "admin", children: /* @__PURE__ */ jsx(AdminDashboard, {}) });
export {
  SplitComponent as component
};
