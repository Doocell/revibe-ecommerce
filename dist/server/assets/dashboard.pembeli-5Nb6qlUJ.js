import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ShoppingBag, CreditCard, Truck, CheckCircle2, Clock, Loader2, RefreshCw, Star, AlertTriangle, Search, Package, Store, MapPin, XCircle, PackageCheck } from "lucide-react";
import { u as useAuth, s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
function BuyerDashboardPage() {
  const {
    user
  } = useAuth();
  const [orders, setOrders] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const [reviewMap, setReviewMap] = useState({});
  const [complaintMap, setComplaintMap] = useState({});
  const [activeComplaintCount, setActiveComplaintCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const highlightedOrderId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("order") ?? "";
  }, []);
  async function loadOrders() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await db.from("orders").select(`
          *,
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
        `).eq("buyer_id", user.id).order("created_at", {
        ascending: false
      });
      if (error) {
        throw new Error(error.message);
      }
      const orderRows = data ?? [];
      setOrders(orderRows);
      const sellerIds = Array.from(new Set(orderRows.map((order) => order.seller_id).filter((sellerId) => Boolean(sellerId))));
      if (sellerIds.length > 0) {
        const {
          data: sellers,
          error: sellerError
        } = await db.from("profiles").select("id, full_name, shop_name").in("id", sellerIds);
        if (sellerError) {
          console.error("[Buyer Dashboard Seller Load Error]", sellerError);
        } else {
          const nextSellerMap = {};
          (sellers ?? []).forEach((seller) => {
            nextSellerMap[seller.id] = seller;
          });
          setSellerMap(nextSellerMap);
        }
      } else {
        setSellerMap({});
      }
      const orderItemIds = orderRows.flatMap((order) => order.order_items ?? []).map((item) => item.id).filter(Boolean);
      if (orderItemIds.length > 0) {
        const {
          data: reviews,
          error: reviewsError
        } = await db.from("reviews").select("*").eq("buyer_id", user.id).in("order_item_id", orderItemIds);
        if (reviewsError) {
          console.error("[Buyer Dashboard Reviews Load Error]", reviewsError);
          setReviewMap({});
        } else {
          const nextReviewMap = {};
          (reviews ?? []).forEach((review) => {
            if (review.order_item_id) {
              nextReviewMap[String(review.order_item_id)] = review;
            }
          });
          setReviewMap(nextReviewMap);
        }
      } else {
        setReviewMap({});
      }
      const orderIds = orderRows.map((order) => order.id).filter(Boolean);
      if (orderIds.length > 0) {
        const {
          data: complaints,
          error: complaintsError
        } = await db.from("order_complaints").select("*").eq("buyer_id", user.id).in("order_id", orderIds).order("created_at", {
          ascending: false
        });
        if (complaintsError) {
          console.error("[Buyer Dashboard Complaints Load Error]", complaintsError);
          setComplaintMap({});
          setActiveComplaintCount(0);
        } else {
          const nextComplaintMap = {};
          (complaints ?? []).forEach((complaint) => {
            if (!nextComplaintMap[complaint.order_id]) {
              nextComplaintMap[complaint.order_id] = complaint;
            }
          });
          setComplaintMap(nextComplaintMap);
          setActiveComplaintCount((complaints ?? []).filter((complaint) => ["open", "seller_responded"].includes(String(complaint.status ?? ""))).length);
        }
      } else {
        setComplaintMap({});
        setActiveComplaintCount(0);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat pesanan.");
      console.error("[Buyer Dashboard Load Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadOrders();
  }, [user?.id]);
  useEffect(() => {
    if (!highlightedOrderId) return;
    setExpandedOrderId(highlightedOrderId);
    window.setTimeout(() => {
      document.getElementById(`buyer-order-${highlightedOrderId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 300);
  }, [highlightedOrderId, orders.length]);
  useEffect(() => {
    function handleBuyerOrderFocus(event) {
      const customEvent = event;
      const orderId = customEvent.detail?.orderId ?? "";
      if (!orderId) return;
      setExpandedOrderId(orderId);
      window.setTimeout(() => {
        document.getElementById(`buyer-order-${orderId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 250);
    }
    window.addEventListener("revibe:buyer-order-focus", handleBuyerOrderFocus);
    return () => {
      window.removeEventListener("revibe:buyer-order-focus", handleBuyerOrderFocus);
    };
  }, []);
  useEffect(() => {
    if (!user?.id) return;
    const channel = db.channel(`buyer_orders_${user.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "orders",
      filter: `buyer_id=eq.${user.id}`
    }, () => {
      loadOrders();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "reviews",
      filter: `buyer_id=eq.${user.id}`
    }, () => {
      loadOrders();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "order_complaints",
      filter: `buyer_id=eq.${user.id}`
    }, () => {
      loadOrders();
    }).subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id]);
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const waitingPayment = orders.filter((order) => isWaitingPayment(order)).length;
    const shipped = orders.filter((order) => isShippedOrder(order)).length;
    const completed = orders.filter((order) => canReviewBuyerOrder(order)).length;
    const active = orders.filter((order) => isActiveOrder(order)).length;
    return [{
      label: "Total Pesanan",
      value: String(totalOrders),
      icon: ShoppingBag
    }, {
      label: "Menunggu Bayar",
      value: String(waitingPayment),
      icon: CreditCard
    }, {
      label: "Sedang Dikirim",
      value: String(shipped),
      icon: Truck
    }, {
      label: "Selesai",
      value: String(completed),
      icon: CheckCircle2
    }, {
      label: "Pesanan Aktif",
      value: String(active),
      icon: Clock
    }];
  }, [orders]);
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchFilter = filterBuyerOrder(order, filter);
      if (!matchFilter) return false;
      const keyword = search.trim().toLowerCase();
      if (!keyword) return true;
      const seller = order.seller_id ? sellerMap[order.seller_id] : null;
      const complaint = complaintMap[order.id];
      const haystack = [order.id, order.order_status, order.payment_status, order.payment_method, order.shipping_method, order.shipping_address, order.courier, order.tracking_number, seller?.shop_name, seller?.full_name, complaint ? "ada komplain" : "", complaint?.reason, complaint?.description, complaint?.status, ...(order.order_items ?? []).map((item) => {
        const product = getOrderItemProduct(item);
        const review = reviewMap[item.id];
        return [product?.title ?? "", review ? "sudah diulas" : "belum diulas", review?.rating ? `rating ${review.rating}` : ""].join(" ");
      })].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [orders, filter, search, sellerMap, reviewMap, complaintMap]);
  async function handleCancelOrder(order) {
    if (!user?.id) return;
    if (!canCancelBuyerOrder(order)) {
      toast.error("Pesanan ini tidak bisa dibatalkan.");
      return;
    }
    const confirmed = window.confirm("Batalkan pesanan ini? Stok produk akan dikembalikan.");
    if (!confirmed) return;
    setUpdatingId(order.id);
    try {
      const {
        error
      } = await db.from("orders").update({
        order_status: "dibatalkan",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", order.id).eq("buyer_id", user.id);
      if (error) {
        throw new Error(error.message);
      }
      await restoreStockForCancelledOrder(order);
      toast.success("Pesanan berhasil dibatalkan.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan pesanan.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleConfirmReceived(order) {
    if (!user?.id) return;
    if (!canConfirmReceived(order)) {
      toast.error("Pesanan belum bisa dikonfirmasi diterima.");
      return;
    }
    const confirmed = window.confirm("Konfirmasi pesanan sudah diterima? Setelah ini kamu bisa memberi ulasan produk.");
    if (!confirmed) return;
    setUpdatingId(order.id);
    try {
      const {
        error
      } = await db.from("orders").update({
        order_status: "selesai",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", order.id).eq("buyer_id", user.id);
      if (error) {
        throw new Error(error.message);
      }
      toast.success("Pesanan selesai. Kamu sekarang bisa memberi ulasan.");
      await loadOrders();
      window.setTimeout(() => {
        document.getElementById(`buyer-order-${order.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 300);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengonfirmasi pesanan.");
    } finally {
      setUpdatingId(null);
    }
  }
  if (!user?.id) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Dashboard Pembeli" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login sebagai pembeli untuk melihat pesanan." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login Pembeli" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Dashboard Pembeli" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau pembayaran, pengiriman, nomor resi, pembatalan, konfirmasi pesanan diterima, ulasan, dan komplain." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadOrders, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Belanja Lagi" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/invoice", children: "Invoice Saya" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/tracking", children: "Tracking Pesanan" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/ulasan", children: [
            /* @__PURE__ */ jsx(Star, { className: "mr-2 h-4 w-4" }),
            "Ulasan Saya"
          ] }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/komplain", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "mr-2 h-4 w-4" }),
            "Komplain",
            activeComplaintCount > 0 ? ` (${activeComplaintCount})` : ""
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5", children: stats.map((stat) => /* @__PURE__ */ jsx(StatCard, { label: stat.label, value: stat.value, icon: /* @__PURE__ */ jsx(stat.icon, { className: "h-6 w-6 text-primary" }) }, stat.label)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Pesanan Saya" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pesanan yang dibuat dari checkout. Jika order bermasalah, gunakan tombol komplain pada pesanan yang sudah dikirim atau selesai." })
          ] }),
          /* @__PURE__ */ jsxs("select", { value: filter, onChange: (event) => setFilter(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
            /* @__PURE__ */ jsx("option", { value: "all", children: "Semua Pesanan" }),
            /* @__PURE__ */ jsx("option", { value: "active", children: "Pesanan Aktif" }),
            /* @__PURE__ */ jsx("option", { value: "waiting_payment", children: "Menunggu Bayar" }),
            /* @__PURE__ */ jsx("option", { value: "processing", children: "Diproses Seller" }),
            /* @__PURE__ */ jsx("option", { value: "shipped", children: "Dikirim" }),
            /* @__PURE__ */ jsx("option", { value: "completed", children: "Selesai/Diterima" }),
            /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Dibatalkan" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-5", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari order ID, seller, produk, kurir, resi, ulasan, komplain...", className: "pl-9" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : filteredOrders.length === 0 ? /* @__PURE__ */ jsx(EmptyOrders, {}) : /* @__PURE__ */ jsx("div", { className: "space-y-5", children: filteredOrders.map((order) => /* @__PURE__ */ jsx(BuyerOrderCard, { order, seller: order.seller_id ? sellerMap[order.seller_id] : null, reviewMap, complaint: complaintMap[order.id] ?? null, highlighted: highlightedOrderId === order.id, expanded: expandedOrderId === order.id, updating: updatingId === order.id, onToggleExpanded: () => setExpandedOrderId((current) => current === order.id ? null : order.id), onCancel: () => handleCancelOrder(order), onConfirmReceived: () => handleConfirmReceived(order) }, order.id)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function BuyerOrderCard({
  order,
  seller,
  reviewMap,
  complaint,
  highlighted,
  expanded,
  updating,
  onToggleExpanded,
  onCancel,
  onConfirmReceived
}) {
  const reviewable = canReviewBuyerOrder(order);
  const canCancel = canCancelBuyerOrder(order);
  const canConfirm = canConfirmReceived(order);
  const shipped = isShippedOrder(order);
  const itemCount = order.order_items?.length ?? 0;
  const reviewedCount = (order.order_items ?? []).filter((item) => reviewMap[item.id]).length;
  return /* @__PURE__ */ jsxs("article", { id: `buyer-order-${order.id}`, className: `rounded-2xl border bg-background p-5 transition ${highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Order ID" }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold", children: order.id }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx(Store, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Seller:" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: seller?.shop_name || seller?.full_name || "Seller" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Dibuat: ",
          new Date(order.created_at).toLocaleString("id-ID")
        ] }),
        reviewable ? /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Ulasan: ",
          reviewedCount,
          "/",
          itemCount,
          " produk sudah diulas"
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: orderStatusClass(order.order_status), children: orderStatusLabel(order.order_status) }),
        /* @__PURE__ */ jsx("span", { className: paymentStatusClass(order.payment_status), children: paymentStatusLabel(order.payment_status) }),
        complaint ? /* @__PURE__ */ jsx("span", { className: buyerComplaintStatusClass(complaint.status), children: "Ada Komplain" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-5 border-t border-border" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: (order.order_items ?? []).map((item) => /* @__PURE__ */ jsx(BuyerOrderItem, { order, item, reviewable, existingReview: reviewMap[item.id] ?? null }, item.id)) }),
    /* @__PURE__ */ jsx("div", { className: "my-5 border-t border-border" }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Info, { label: "Metode Pembayaran", value: paymentMethodLabel(order.payment_method) }),
        /* @__PURE__ */ jsx(Info, { label: "Ongkir", value: formatIDR(Number(order.shipping_cost ?? 0)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Info, { label: "Metode Pengiriman", value: order.shipping_method || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Total Order", value: formatIDR(getOrderTotal(order)), strong: true })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-2xl bg-green-100 p-4 text-green-950", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
        "Alamat Pengiriman"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-green-900", children: order.shipping_address || "-" })
    ] }),
    shipped || order.tracking_number ? /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-purple-950", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
        /* @__PURE__ */ jsx(Truck, { className: "h-4 w-4" }),
        "Detail Pengiriman"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Info, { label: "Jasa Kirim", value: order.courier || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Nomor Resi", value: order.tracking_number || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Tanggal Kirim", value: order.shipped_at ? new Date(order.shipped_at).toLocaleString("id-ID") : "-" })
      ] })
    ] }) : null,
    expanded ? /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Detail Pesanan" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 text-sm md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Info, { label: "Subtotal", value: formatIDR(Number(order.subtotal ?? 0)) }),
        /* @__PURE__ */ jsx(Info, { label: "Total Produk", value: `${itemCount} item` }),
        /* @__PURE__ */ jsx(Info, { label: "Status Order", value: orderStatusLabel(order.order_status) }),
        /* @__PURE__ */ jsx(Info, { label: "Status Pembayaran", value: paymentStatusLabel(order.payment_status) })
      ] }),
      reviewable ? /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary", children: [
        "Pesanan ini sudah selesai. Status ulasan: ",
        reviewedCount,
        "/",
        itemCount,
        " produk sudah diulas."
      ] }) : null,
      complaint ? /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-xl bg-yellow-100 p-4 text-sm text-yellow-800", children: "Pesanan ini memiliki komplain aktif/riwayat komplain." }) : null
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onToggleExpanded, children: expanded ? "Tutup Detail" : "Lihat Detail" }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: `/invoice?order=${order.id}`, children: "Invoice" }) }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: `/tracking?order=${order.id}`, children: "Lacak Pesanan" }) }),
      canCancel ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", disabled: updating, onClick: onCancel, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }),
        "Batalkan Pesanan"
      ] }) : null,
      canConfirm ? /* @__PURE__ */ jsxs(Button, { type: "button", disabled: updating, onClick: onConfirmReceived, className: "gradient-brand text-white", children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(PackageCheck, { className: "mr-2 h-4 w-4" }),
        "Pesanan Diterima"
      ] }) : null,
      reviewable ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/ulasan", children: [
        /* @__PURE__ */ jsx(Star, { className: "mr-2 h-4 w-4" }),
        "Lihat Semua Ulasan"
      ] }) }) : null,
      canOpenComplaintShortcut(order) ? complaint ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/komplain?complaint=${complaint.id}`, children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mr-2 h-4 w-4" }),
        "Lihat Komplain"
      ] }) }) : /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/komplain?order=${order.id}`, children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mr-2 h-4 w-4" }),
        "Buat Komplain"
      ] }) }) : null
    ] })
  ] });
}
function BuyerOrderItem({
  order,
  item,
  reviewable,
  existingReview
}) {
  const product = getOrderItemProduct(item);
  const image = product?.images?.[0] ?? "";
  const title = product?.title ?? "Produk";
  const itemTotal = Number(item.price ?? 0) * Number(item.quantity ?? 0);
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
    /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-start justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "line-clamp-2 font-semibold hover:text-primary", children: title }),
        existingReview ? /* @__PURE__ */ jsxs("div", { className: "mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 fill-current" }),
          "Sudah Diulas Â· ",
          existingReview.rating,
          "/5"
        ] }) : reviewable ? /* @__PURE__ */ jsxs("div", { className: "mt-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5" }),
          "Belum Diulas"
        ] }) : null
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
        item.quantity,
        "x ",
        formatIDR(Number(item.price))
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 font-semibold", children: formatIDR(itemTotal) }),
      reviewable ? /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxs("a", { href: `/ulasan?order=${order.id}&product=${item.product_id}&item=${item.id}`, children: [
          /* @__PURE__ */ jsx(Star, { className: "mr-2 h-4 w-4" }),
          existingReview ? "Edit Ulasan" : "Beri Ulasan"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "sm", children: /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, children: "Lihat Produk" }) })
      ] }) : null
    ] })
  ] });
}
function StatCard({
  label,
  value,
  icon
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    icon,
    /* @__PURE__ */ jsx("div", { className: "mt-4 text-2xl font-bold", children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: label })
  ] });
}
function Info({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: strong ? "text-lg font-bold text-primary" : "font-medium", children: value || "-" })
  ] });
}
function EmptyOrders() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada pesanan" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Pesanan akan muncul di sini setelah kamu menyelesaikan checkout." }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Mulai Belanja" }) })
  ] });
}
async function restoreStockForCancelledOrder(order) {
  const items = order.order_items ?? [];
  for (const item of items) {
    const productId = item.product_id;
    const quantity = Number(item.quantity ?? 0);
    if (!productId || quantity <= 0) continue;
    const {
      data: productData,
      error: productError
    } = await db.from("products").select("id, stock").eq("id", productId).maybeSingle();
    if (productError || !productData) {
      console.error("[Restore Stock Read Error]", productError);
      continue;
    }
    const currentStock = Number(productData.stock ?? 0);
    const nextStock = currentStock + quantity;
    const {
      error: updateError
    } = await db.from("products").update({
      stock: nextStock,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", productId);
    if (updateError) {
      console.error("[Restore Stock Update Error]", updateError);
    }
  }
}
function getOrderItemProduct(item) {
  if (Array.isArray(item.products)) {
    return item.products[0] ?? null;
  }
  return item.products ?? null;
}
function getOrderTotal(order) {
  return Number(order.total ?? 0);
}
function filterBuyerOrder(order, filter) {
  if (filter === "all") return true;
  if (filter === "active") return isActiveOrder(order);
  if (filter === "waiting_payment") return isWaitingPayment(order);
  if (filter === "processing") return isProcessingOrder(order);
  if (filter === "shipped") return isShippedOrder(order);
  if (filter === "completed") return canReviewBuyerOrder(order);
  if (filter === "cancelled") return isCancelledOrder(order);
  return true;
}
function canReviewBuyerOrder(order) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);
  const isOrderFinished = orderStatus === "selesai" || orderStatus === "pesanan_diterima" || orderStatus === "diterima" || orderStatus === "completed" || orderStatus === "delivered";
  const isPaid = paymentStatus === "dibayar" || paymentStatus === "paid" || paymentStatus === "settlement" || paymentStatus === "success";
  return isOrderFinished && isPaid;
}
function canOpenComplaintShortcut(order) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);
  const paid = paymentStatus === "dibayar" || paymentStatus === "paid" || paymentStatus === "settlement" || paymentStatus === "success";
  const complaintAllowed = orderStatus === "dikirim" || orderStatus === "shipped" || orderStatus === "selesai" || orderStatus === "pesanan_diterima" || orderStatus === "completed" || orderStatus === "delivered";
  return paid && complaintAllowed;
}
function canConfirmReceived(order) {
  const orderStatus = normalizeStatus(order.order_status);
  const paymentStatus = normalizeStatus(order.payment_status);
  const paid = paymentStatus === "dibayar" || paymentStatus === "paid" || paymentStatus === "settlement" || paymentStatus === "success";
  const shipped = orderStatus === "dikirim" || orderStatus === "shipped" || orderStatus === "delivered";
  return paid && shipped && !canReviewBuyerOrder(order);
}
function canCancelBuyerOrder(order) {
  const orderStatus = normalizeStatus(order.order_status);
  if (isCancelledOrder(order)) return false;
  if (canReviewBuyerOrder(order)) return false;
  if (isShippedOrder(order)) return false;
  if (order.tracking_number) return false;
  return ["menunggu_pembayaran", "menunggu_konfirmasi_penjual", "menunggu_konfirmasi", "diproses_penjual", "diproses", "pending", "processing"].includes(orderStatus);
}
function isWaitingPayment(order) {
  const paymentStatus = normalizeStatus(order.payment_status);
  const orderStatus = normalizeStatus(order.order_status);
  return paymentStatus === "menunggu_pembayaran" || paymentStatus === "pending" || orderStatus === "menunggu_pembayaran";
}
function isProcessingOrder(order) {
  const orderStatus = normalizeStatus(order.order_status);
  return ["menunggu_konfirmasi_penjual", "menunggu_konfirmasi", "diproses_penjual", "diproses", "processing"].includes(orderStatus);
}
function isShippedOrder(order) {
  const orderStatus = normalizeStatus(order.order_status);
  return orderStatus === "dikirim" || orderStatus === "shipped" || Boolean(order.tracking_number);
}
function isCancelledOrder(order) {
  const orderStatus = normalizeStatus(order.order_status);
  return orderStatus === "dibatalkan" || orderStatus === "cancelled";
}
function isActiveOrder(order) {
  if (isCancelledOrder(order)) return false;
  if (canReviewBuyerOrder(order)) return false;
  return true;
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
function paymentMethodLabel(method) {
  const labels = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    bank_transfer: "Transfer Bank",
    qris: "QRIS"
  };
  return labels[normalizeStatus(method)] ?? method ?? "-";
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
function buyerComplaintStatusClass(status) {
  const safeStatus = normalizeStatus(status);
  if (safeStatus === "resolved") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (safeStatus === "seller_responded") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }
  if (safeStatus === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "buyer", children: /* @__PURE__ */ jsx(BuyerDashboardPage, {}) });
export {
  SplitComponent as component
};
