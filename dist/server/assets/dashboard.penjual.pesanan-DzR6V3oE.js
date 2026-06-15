import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { ArrowLeft, Loader2, RefreshCw, ShoppingBag, CheckCircle2, Truck } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getSellerOrders(sellerId) {
  const cleanSellerId = String(sellerId ?? "").trim();
  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }
  const { data, error } = await db.from("orders").select(
    `
      *,
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
  ).eq("seller_id", cleanSellerId).order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
async function acceptSellerOrder({
  sellerId,
  orderId
}) {
  const { data, error } = await db.from("orders").update({
    order_status: "diproses_penjual",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", orderId).eq("seller_id", sellerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function shipSellerOrder({
  sellerId,
  orderId,
  courier,
  trackingNumber
}) {
  if (!courier.trim()) {
    throw new Error("Jasa pengiriman wajib diisi.");
  }
  if (!trackingNumber.trim()) {
    throw new Error("Nomor resi wajib diisi.");
  }
  const { data, error } = await db.from("orders").update({
    order_status: "dikirim",
    courier: courier.trim(),
    tracking_number: trackingNumber.trim(),
    shipped_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", orderId).eq("seller_id", sellerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
function orderStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    diproses_penjual: "Diproses Penjual",
    dikirim: "Dikirim",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan"
  };
  return labels[status] ?? status;
}
function paymentStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan"
  };
  return labels[status] ?? status;
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
function SellerOrdersPage() {
  const {
    user
  } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
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
      toast.error(error instanceof Error ? error.message : "Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadOrders();
  }, [user?.id]);
  async function handleAccept(order) {
    if (!user) return;
    setUpdatingId(order.id);
    try {
      await acceptSellerOrder({
        sellerId: user.id,
        orderId: order.id
      });
      toast.success("Pesanan berhasil diproses.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses pesanan.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleShip(order, courier, resi) {
    if (!user) return;
    setUpdatingId(order.id);
    try {
      await shipSellerOrder({
        sellerId: user.id,
        orderId: order.id,
        courier,
        trackingNumber: resi
      });
      toast.success("Resi berhasil disimpan dan pesanan ditandai dikirim.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan resi.");
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Pesanan Masuk" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Kelola pesanan buyer, proses pesanan, dan input nomor resi." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/penjual", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadOrders, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : orders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada pesanan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Pesanan buyer akan muncul di halaman ini." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: orders.map((order) => /* @__PURE__ */ jsx(SellerOrderCard, { order, updating: updatingId === order.id, onAccept: () => handleAccept(order), onShip: (courier, resi) => handleShip(order, courier, resi) }, order.id)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function SellerOrderCard({
  order,
  updating,
  onAccept,
  onShip
}) {
  const [courier, setCourier] = useState(order.courier ?? "");
  const [resi, setResi] = useState(order.tracking_number ?? "");
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-xs font-semibold", children: order.id }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: new Date(order.created_at).toLocaleString("id-ID") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: orderStatusLabel(order.order_status) }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800", children: paymentStatusLabel(order.payment_status) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-3", children: order.order_items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted", children: item.products?.images?.[0] ? /* @__PURE__ */ jsx("img", { src: item.products.images[0], alt: item.products.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: item.products?.title ?? "Produk" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          item.quantity,
          " x ",
          formatIDR(Number(item.price))
        ] })
      ] })
    ] }, item.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Info, { label: "Total", value: formatIDR(Number(order.total ?? 0)) }),
      /* @__PURE__ */ jsx(Info, { label: "Metode Bayar", value: order.payment_method ?? "-" }),
      /* @__PURE__ */ jsx(Info, { label: "Metode Kirim", value: order.shipping_method ?? "-" }),
      /* @__PURE__ */ jsx(Info, { label: "Resi", value: order.tracking_number ?? "-" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl bg-accent p-4 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Alamat Pengiriman" }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 whitespace-pre-line text-muted-foreground", children: order.shipping_address || "-" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]", children: [
      /* @__PURE__ */ jsx(Input, { value: courier, onChange: (event) => setCourier(event.target.value), placeholder: "Jasa kirim, contoh: JNE" }),
      /* @__PURE__ */ jsx(Input, { value: resi, onChange: (event) => setResi(event.target.value), placeholder: "Nomor resi" }),
      order.order_status === "menunggu_konfirmasi_penjual" ? /* @__PURE__ */ jsxs(Button, { type: "button", onClick: onAccept, disabled: updating, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
        "Proses"
      ] }) : null,
      ["diproses_penjual", "menunggu_konfirmasi_penjual"].includes(order.order_status) ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => onShip(courier, resi), disabled: updating, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Truck, { className: "mr-2 h-4 w-4" }),
        "Simpan Resi"
      ] }) : null
    ] })
  ] });
}
function Info({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-medium", children: value })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerOrdersPage, {}) });
export {
  SplitComponent as component
};
