import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Truck, ArrowLeft, Loader2, RefreshCw, FileText, UserRound, Store, Clipboard, Clock, MapPin, Search, CheckCircle2 } from "lucide-react";
import { u as useAuth, N as Navbar, B as Button, F as Footer, s as supabase } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
function TrackingPage() {
  const {
    user,
    roles
  } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(readOrderIdFromUrl());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = (roles ?? []).includes("admin");
  const isSeller = (roles ?? []).includes("seller");
  const isBuyer = (roles ?? []).includes("buyer");
  async function loadTrackingData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = db.from("orders").select(`
          id,
          buyer_id,
          seller_id,
          order_status,
          payment_status,
          payment_method,
          shipping_method,
          shipping_address,
          shipping_cost,
          subtotal,
          total,
          courier,
          tracking_number,
          shipped_at,
          created_at,
          updated_at,
          order_items(
            id,
            order_id,
            product_id,
            quantity,
            price,
            products(
              id,
              title,
              images
            )
          )
        `).order("created_at", {
        ascending: false
      });
      if (!isAdmin) {
        query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        throw new Error(error.message);
      }
      const rows = data ?? [];
      setOrders(rows);
      const profileIds = Array.from(new Set(rows.flatMap((order) => [order.buyer_id, order.seller_id]).filter((id) => Boolean(id))));
      if (profileIds.length > 0) {
        const {
          data: profiles,
          error: profileError
        } = await db.from("profiles").select("id, full_name, shop_name, whatsapp, address, city").in("id", profileIds);
        if (profileError) {
          console.error("[Tracking Profile Load Error]", profileError);
          setProfileMap({});
        } else {
          const nextMap = {};
          (profiles ?? []).forEach((profile) => {
            nextMap[profile.id] = profile;
          });
          setProfileMap(nextMap);
        }
      } else {
        setProfileMap({});
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat tracking.");
      console.error("[Tracking Load Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadTrackingData();
  }, [user?.id, isAdmin]);
  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => {
      const buyer = profileMap[order.buyer_id];
      const seller = order.seller_id ? profileMap[order.seller_id] : null;
      const productText = (order.order_items ?? []).map((item) => getOrderItemProduct(item)?.title ?? "").join(" ");
      const haystack = [order.id, order.order_status, order.payment_status, order.payment_method, order.shipping_method, order.shipping_address, order.courier, order.tracking_number, buyer?.full_name, buyer?.shop_name, seller?.full_name, seller?.shop_name, productText].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [orders, search, profileMap]);
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((order) => order.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);
  function openTracking(orderId) {
    setSelectedOrderId(orderId);
    window.history.pushState(null, "", `/tracking?order=${orderId}`);
    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, 50);
  }
  function closeTracking() {
    setSelectedOrderId("");
    window.history.pushState(null, "", "/tracking");
  }
  if (!user?.id) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(Truck, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Tracking Pesanan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login untuk melacak pengiriman pesanan." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login Pembeli" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/login/penjual", children: "Login Penjual" }) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Tracking Pesanan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Lacak kurir, nomor resi, status order, dan alamat pengiriman." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          selectedOrder ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: closeTracking, children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Semua Tracking"
          ] }) : null,
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadTrackingData, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: isSeller ? "/dashboard/penjual" : "/dashboard/pembeli", children: "Kembali Dashboard" }) })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : selectedOrder ? /* @__PURE__ */ jsx(TrackingDetail, { order: selectedOrder, buyer: profileMap[selectedOrder.buyer_id] ?? null, seller: selectedOrder.seller_id ? profileMap[selectedOrder.seller_id] ?? null : null, viewerRole: isSeller ? "seller" : isBuyer ? "buyer" : "admin", onBack: closeTracking }) : /* @__PURE__ */ jsx(TrackingList, { orders: filteredOrders, profileMap, search, onSearchChange: setSearch, onOpenTracking: openTracking })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function TrackingList({
  orders,
  profileMap,
  search,
  onSearchChange,
  onOpenTracking
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Daftar Tracking" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pilih pesanan untuk melihat status pengiriman." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
        orders.length,
        " pesanan"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-5", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => onSearchChange(event.target.value), placeholder: "Cari order ID, produk, seller, buyer, resi, kurir...", className: "pl-9" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: orders.length === 0 ? /* @__PURE__ */ jsx(EmptyTrackingList, {}) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: orders.map((order) => {
      const buyer = profileMap[order.buyer_id];
      const seller = order.seller_id ? profileMap[order.seller_id] : null;
      const firstItem = order.order_items?.[0];
      const firstProduct = firstItem ? getOrderItemProduct(firstItem) : null;
      return /* @__PURE__ */ jsx("article", { className: "rounded-2xl border border-border bg-background p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx(Truck, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold", children: order.id })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [
            "Dibuat:",
            " ",
            new Date(order.created_at).toLocaleString("id-ID")
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm md:grid-cols-3", children: [
            /* @__PURE__ */ jsx(InfoLine, { label: "Buyer", value: profileDisplayName(buyer, "Buyer") }),
            /* @__PURE__ */ jsx(InfoLine, { label: "Seller", value: profileDisplayName(seller, "Seller") }),
            /* @__PURE__ */ jsx(InfoLine, { label: "Produk", value: firstProduct ? `${firstProduct.title}${order.order_items.length > 1 ? ` +${order.order_items.length - 1} lainnya` : ""}` : "-" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: orderStatusClass(order.order_status), children: orderStatusLabel(order.order_status) }),
            /* @__PURE__ */ jsx("span", { className: paymentStatusClass(order.payment_status), children: paymentStatusLabel(order.payment_status) }),
            order.tracking_number ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700", children: "Resi Tersedia" }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700", children: "Belum Ada Resi" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-left lg:text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: formatIDR(getOrderTotal(order)) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", onClick: () => onOpenTracking(order.id), className: "mt-4 gradient-brand text-white", children: [
            /* @__PURE__ */ jsx(Truck, { className: "mr-2 h-4 w-4" }),
            "Lacak Pesanan"
          ] })
        ] })
      ] }) }, order.id);
    }) }) })
  ] });
}
function TrackingDetail({
  order,
  buyer,
  seller,
  viewerRole,
  onBack
}) {
  const timeline = buildTrackingTimeline(order);
  return /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-between gap-3", children: [
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onBack, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Kembali ke Daftar Tracking"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/invoice?order=${order.id}`, children: [
          /* @__PURE__ */ jsx(FileText, { className: "mr-2 h-4 w-4" }),
          "Invoice"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: viewerRole === "seller" ? "/dashboard/penjual" : "/dashboard/pembeli", children: "Dashboard" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("article", { className: "mt-6 rounded-3xl border border-border bg-card p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_390px]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
              /* @__PURE__ */ jsx(Truck, { className: "h-4 w-4" }),
              "Tracking ReVibe"
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "mt-4 text-2xl font-bold", children: "Detail Pengiriman" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 break-all font-mono text-sm text-muted-foreground", children: [
              "Order ",
              order.id
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: orderStatusClass(order.order_status), children: orderStatusLabel(order.order_status) }),
            /* @__PURE__ */ jsx("span", { className: paymentStatusClass(order.payment_status), children: paymentStatusLabel(order.payment_status) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(PartyCard, { icon: /* @__PURE__ */ jsx(UserRound, { className: "h-5 w-5 text-primary" }), title: "Buyer", name: profileDisplayName(buyer, "Buyer"), phone: buyer?.whatsapp ?? null, address: buildProfileAddress(buyer) }),
          /* @__PURE__ */ jsx(PartyCard, { icon: /* @__PURE__ */ jsx(Store, { className: "h-5 w-5 text-primary" }), title: "Seller", name: profileDisplayName(seller, "Seller"), phone: seller?.whatsapp ?? null, address: buildProfileAddress(seller) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-3", children: [
          /* @__PURE__ */ jsx(TrackingInfoCard, { icon: /* @__PURE__ */ jsx(Truck, { className: "h-5 w-5 text-primary" }), label: "Kurir", value: order.courier || "-" }),
          /* @__PURE__ */ jsx(TrackingInfoCard, { icon: /* @__PURE__ */ jsx(Clipboard, { className: "h-5 w-5 text-primary" }), label: "Nomor Resi", value: order.tracking_number || "Belum tersedia", action: order.tracking_number ? /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => copyText(order.tracking_number || ""), children: "Salin" }) : null }),
          /* @__PURE__ */ jsx(TrackingInfoCard, { icon: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-primary" }), label: "Tanggal Kirim", value: order.shipped_at ? new Date(order.shipped_at).toLocaleString("id-ID") : "Belum dikirim" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl bg-green-100 p-4 text-green-950", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
            "Alamat Pengiriman"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-green-900", children: order.shipping_address || "-" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 overflow-hidden rounded-2xl border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-accent px-4 py-3 font-semibold", children: "Produk Dikirim" }),
          /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: (order.order_items ?? []).map((item) => {
            const product = getOrderItemProduct(item);
            const image = product?.images?.[0] ?? "";
            const itemPrice = Number(item.price ?? 0);
            const itemQuantity = Number(item.quantity ?? 0);
            const itemTotal = itemPrice * itemQuantity;
            return /* @__PURE__ */ jsxs("div", { className: "grid gap-4 p-4 md:grid-cols-[72px_1fr_auto]", children: [
              /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "h-[72px] w-[72px] overflow-hidden rounded-xl bg-muted", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product?.title ?? "Produk", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "font-semibold hover:text-primary", children: product?.title ?? "Produk" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
                  itemQuantity,
                  " x ",
                  formatIDR(itemPrice)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-left md:text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Subtotal" }),
                /* @__PURE__ */ jsx("div", { className: "font-bold", children: formatIDR(itemTotal) })
              ] })
            ] }, item.id);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Ringkasan Tracking" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3 text-sm", children: [
            /* @__PURE__ */ jsx(SummaryRow, { label: "Status Order", value: orderStatusLabel(order.order_status) }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Status Bayar", value: paymentStatusLabel(order.payment_status) }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Metode Kirim", value: order.shipping_method || "-" }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Kurir", value: order.courier || "-" }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Nomor Resi", value: order.tracking_number || "-" }),
            /* @__PURE__ */ jsx("div", { className: "border-t border-border pt-3", children: /* @__PURE__ */ jsx(SummaryRow, { label: "Total", value: formatIDR(getOrderTotal(order)), strong: true }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Timeline Pesanan" }),
          /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-4", children: timeline.map((item, index) => /* @__PURE__ */ jsx(TimelineItem, { title: item.title, description: item.description, date: item.date, done: item.done, active: item.active }, `${item.title}-${index}`)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary", children: "Tracking ini memakai status internal ReVibe. Untuk tracking real-time ekspedisi, salin nomor resi lalu cek di website resmi kurir." })
      ] })
    ] }) })
  ] });
}
function TimelineItem({
  title,
  description,
  date,
  done,
  active
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: `mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : active ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`, children: done ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: title }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: description }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: date })
    ] })
  ] });
}
function PartyCard({
  icon,
  title,
  name,
  phone,
  address
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
      icon,
      title
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 font-bold", children: name }),
    phone ? /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: phone }) : null,
    /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-muted-foreground", children: address || "-" })
  ] });
}
function TrackingInfoCard({
  icon,
  label,
  value,
  action
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsx("div", { children: icon }),
      action
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 break-all font-semibold", children: value })
  ] });
}
function SummaryRow({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsx("span", { className: strong ? "font-semibold" : "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: strong ? "text-lg font-bold text-primary" : "font-medium", children: value })
  ] });
}
function InfoLine({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-medium", children: value || "-" })
  ] });
}
function EmptyTrackingList() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(Truck, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada pesanan" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tracking akan muncul setelah ada pesanan." }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Mulai Belanja" }) })
  ] });
}
function buildTrackingTimeline(order) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);
  const isPaid = paymentStatus === "dibayar" || paymentStatus === "paid" || paymentStatus === "settlement" || paymentStatus === "success";
  const isProcessing = orderStatus === "menunggu_konfirmasi_penjual" || orderStatus === "menunggu_konfirmasi" || orderStatus === "diproses_penjual" || orderStatus === "diproses" || orderStatus === "processing";
  const isShipped = orderStatus === "dikirim" || orderStatus === "shipped" || Boolean(order.tracking_number);
  const isCompleted = orderStatus === "selesai" || orderStatus === "pesanan_diterima" || orderStatus === "diterima" || orderStatus === "completed" || orderStatus === "delivered";
  const isCancelled = orderStatus === "dibatalkan" || orderStatus === "cancelled";
  const createdDate = order.created_at ? new Date(order.created_at).toLocaleString("id-ID") : "-";
  const updatedDate = order.updated_at ? new Date(order.updated_at).toLocaleString("id-ID") : "-";
  const shippedDate = order.shipped_at ? new Date(order.shipped_at).toLocaleString("id-ID") : "-";
  return [{
    title: "Pesanan Dibuat",
    description: "Buyer membuat pesanan melalui checkout.",
    date: createdDate,
    done: true,
    active: false
  }, {
    title: "Pembayaran",
    description: isPaid ? "Pembayaran sudah tercatat." : "Pembayaran masih menunggu atau belum berhasil.",
    date: isPaid ? createdDate : "-",
    done: isPaid,
    active: !isPaid && !isCancelled
  }, {
    title: "Diproses Seller",
    description: isProcessing || isShipped || isCompleted ? "Seller sedang/ sudah memproses pesanan." : "Pesanan belum diproses seller.",
    date: isProcessing || isShipped || isCompleted ? updatedDate : "-",
    done: isProcessing || isShipped || isCompleted,
    active: isPaid && !isProcessing && !isShipped && !isCompleted && !isCancelled
  }, {
    title: "Dikirim",
    description: isShipped ? `Pesanan dikirim${order.courier ? ` via ${order.courier}` : ""}${order.tracking_number ? ` dengan resi ${order.tracking_number}` : ""}.` : "Nomor resi belum tersedia.",
    date: isShipped ? shippedDate : "-",
    done: isShipped,
    active: isProcessing && !isShipped && !isCompleted && !isCancelled
  }, {
    title: "Selesai / Diterima",
    description: isCompleted ? "Pesanan sudah selesai atau diterima buyer." : "Pesanan belum ditandai selesai.",
    date: isCompleted ? updatedDate : "-",
    done: isCompleted,
    active: isShipped && !isCompleted && !isCancelled
  }, {
    title: isCancelled ? "Pesanan Dibatalkan" : "Riwayat Lanjutan",
    description: isCancelled ? "Pesanan ini sudah dibatalkan." : "Invoice, ulasan, dan komplain bisa dicek dari dashboard terkait.",
    date: isCancelled ? updatedDate : "-",
    done: isCancelled,
    active: false
  }];
}
async function copyText(value) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Nomor resi disalin.");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    toast.success("Nomor resi disalin.");
  }
}
function readOrderIdFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("order") ?? "";
}
function getOrderItemProduct(item) {
  if (Array.isArray(item.products)) {
    return item.products[0] ?? null;
  }
  return item.products ?? null;
}
function getOrderTotal(order) {
  const total = Number(order.total ?? 0);
  if (Number.isFinite(total) && total > 0) return total;
  return calculateItemsSubtotal(order) + Number(order.shipping_cost ?? 0);
}
function calculateItemsSubtotal(order) {
  return (order.order_items ?? []).reduce((sum, item) => {
    return sum + Number(item.price ?? 0) * Number(item.quantity ?? 0);
  }, 0);
}
function buildProfileAddress(profile) {
  if (!profile) return "-";
  const address = profile.address?.trim() ?? "";
  const city = profile.city?.trim() ?? "";
  if (address && city) return `${address}, ${city}`;
  if (address) return address;
  if (city) return city;
  return "-";
}
function profileDisplayName(profile, fallback) {
  if (!profile) return fallback;
  return profile.shop_name || profile.full_name || fallback;
}
function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}
function orderStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    diproses_penjual: "Diproses Penjual",
    diproses: "Diproses",
    dikirim: "Dikirim",
    shipped: "Dikirim",
    delivered: "Diterima",
    pesanan_diterima: "Pesanan Diterima",
    diterima: "Diterima",
    selesai: "Selesai",
    completed: "Selesai",
    dibatalkan: "Dibatalkan",
    cancelled: "Dibatalkan"
  };
  return labels[normalizeStatus(status)] ?? status ?? "-";
}
function paymentStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    pending: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    paid: "Dibayar",
    settlement: "Dibayar",
    success: "Dibayar",
    gagal: "Gagal",
    failed: "Gagal",
    dikembalikan: "Dikembalikan",
    refunded: "Dikembalikan"
  };
  return labels[normalizeStatus(status)] ?? status ?? "-";
}
function orderStatusClass(status) {
  const safeStatus = normalizeStatus(status);
  if (safeStatus === "selesai" || safeStatus === "pesanan_diterima" || safeStatus === "diterima" || safeStatus === "completed" || safeStatus === "delivered") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (safeStatus === "dikirim" || safeStatus === "shipped") {
    return "rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700";
  }
  if (safeStatus === "dibatalkan" || safeStatus === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  if (safeStatus === "diproses_penjual" || safeStatus === "diproses") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }
  return "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary";
}
function paymentStatusClass(status) {
  const safeStatus = normalizeStatus(status);
  if (safeStatus === "dibayar" || safeStatus === "paid" || safeStatus === "settlement" || safeStatus === "success") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (safeStatus === "gagal" || safeStatus === "failed") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
export {
  TrackingPage as component
};
