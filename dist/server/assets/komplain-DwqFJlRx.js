import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Outlet } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, MessageSquareWarning, Package, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { C as COMPLAINT_REASONS, g as getBuyerComplaintOrders, b as complaintStatusLabel, a as complaintReasonLabel, c as cancelComplaint, r as resolveComplaint, s as submitOrderComplaint } from "./complaints-Ba1Vn0v4.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
function ComplaintRouteSwitcher() {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/komplain/penjual")) {
    return /* @__PURE__ */ jsx(Outlet, {});
  }
  return /* @__PURE__ */ jsx(RoleGuard, { required: "buyer", children: /* @__PURE__ */ jsx(BuyerComplaintPage, {}) });
}
function BuyerComplaintPage() {
  const {
    user
  } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState("barang_tidak_sesuai");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const highlightedComplaintId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("complaint") ?? "";
  }, []);
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
      const rows = await getBuyerComplaintOrders(user.id);
      setOrders(rows);
      if (highlightedComplaintId) {
        const matched = rows.find((order) => order.complaint?.id === highlightedComplaintId);
        if (matched) {
          setSelectedOrder(null);
          window.setTimeout(() => {
            document.getElementById(`buyer-complaint-${highlightedComplaintId}`)?.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }, 250);
        }
      }
      if (highlightedOrderId) {
        const matchedOrder = rows.find((order) => order.id === highlightedOrderId);
        if (matchedOrder) {
          if (!matchedOrder.complaint || matchedOrder.complaint.status === "cancelled") {
            setSelectedOrder(matchedOrder);
          }
          window.setTimeout(() => {
            const targetId = matchedOrder.complaint ? `buyer-complaint-${matchedOrder.complaint.id}` : `buyer-complaint-order-${matchedOrder.id}`;
            document.getElementById(targetId)?.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }, 250);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat komplain.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadOrders();
  }, [user?.id]);
  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => {
      const text = [order.id, order.order_status, order.payment_status, order.tracking_number, order.courier, order.complaint?.reason, order.complaint?.description, order.complaint?.status, ...order.order_items.map((item) => item.title)].filter(Boolean).join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [orders, search]);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!user?.id || !selectedOrder) {
      toast.error("Data komplain tidak valid.");
      return;
    }
    setSaving(true);
    try {
      await submitOrderComplaint({
        buyerId: user.id,
        orderId: selectedOrder.id,
        sellerId: selectedOrder.seller_id,
        reason,
        description
      });
      toast.success("Komplain berhasil dikirim ke seller.");
      setSelectedOrder(null);
      setDescription("");
      setReason("barang_tidak_sesuai");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim komplain.");
    } finally {
      setSaving(false);
    }
  }
  async function handleResolve(order) {
    if (!user?.id || !order.complaint) return;
    setSaving(true);
    try {
      await resolveComplaint({
        userId: user.id,
        complaintId: order.complaint.id
      });
      toast.success("Komplain ditandai selesai.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyelesaikan komplain.");
    } finally {
      setSaving(false);
    }
  }
  async function handleCancel(order) {
    if (!user?.id || !order.complaint) return;
    const confirmed = window.confirm("Batalkan komplain ini?");
    if (!confirmed) return;
    setSaving(true);
    try {
      await cancelComplaint({
        buyerId: user.id,
        complaintId: order.complaint.id
      });
      toast.success("Komplain dibatalkan.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan komplain.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Komplain Pesanan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Laporkan masalah pada pesanan yang sudah dikirim atau selesai." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadOrders, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/pembeli", children: "Dashboard Pembeli" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari order, produk, resi, status komplain...", className: "pl-9" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : filteredOrders.length === 0 ? /* @__PURE__ */ jsx(EmptyComplaintOrders, {}) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filteredOrders.map((order) => /* @__PURE__ */ jsx(BuyerComplaintCard, { order, highlighted: highlightedComplaintId === order.complaint?.id || highlightedOrderId === order.id, saving, onSelect: () => {
          setSelectedOrder(order);
          setDescription("");
          setReason("barang_tidak_sesuai");
        }, onResolve: () => handleResolve(order), onCancel: () => handleCancel(order) }, order.id)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {}),
    selectedOrder ? /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Buat Komplain" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            "Order ",
            selectedOrder.id
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedOrder(null), children: "Tutup" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Alasan Komplain" }),
          /* @__PURE__ */ jsx("select", { value: reason, onChange: (event) => setReason(event.target.value), className: "mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm", children: COMPLAINT_REASONS.map((item) => /* @__PURE__ */ jsx("option", { value: item.value, children: item.label }, item.value)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Deskripsi Masalah" }),
          /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (event) => setDescription(event.target.value), rows: 6, placeholder: "Jelaskan masalahnya secara jelas.", className: "mt-2" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedOrder(null), children: "Batal" }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
          saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(MessageSquareWarning, { className: "mr-2 h-4 w-4" }),
          "Kirim Komplain"
        ] })
      ] })
    ] }) }) : null
  ] });
}
function BuyerComplaintCard({
  order,
  highlighted,
  saving,
  onSelect,
  onResolve,
  onCancel
}) {
  const complaint = order.complaint;
  return /* @__PURE__ */ jsxs("div", { id: complaint ? `buyer-complaint-${complaint.id}` : `buyer-complaint-order-${order.id}`, className: `rounded-2xl border bg-background p-5 ${highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold", children: order.id }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: new Date(order.created_at).toLocaleString("id-ID") }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [
          "Kurir: ",
          order.courier || "-",
          " · Resi:",
          " ",
          order.tracking_number || "-"
        ] })
      ] }),
      complaint ? /* @__PURE__ */ jsx("span", { className: complaintStatusClass(complaint.status), children: complaintStatusLabel(complaint.status) }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700", children: "Belum Ada Komplain" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: order.order_items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3 rounded-xl border p-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted", children: item.image ? /* @__PURE__ */ jsx("img", { src: item.image, alt: item.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: item.title }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
          item.quantity,
          " x ",
          formatIDR(item.price)
        ] })
      ] })
    ] }, item.id)) }),
    complaint ? /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl bg-accent p-4 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: complaintReasonLabel(complaint.reason) }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: complaint.description }),
      complaint.seller_response ? /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold text-primary", children: "Respons Seller" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: complaint.seller_response })
      ] }) : null
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap justify-end gap-2", children: [
      !complaint || complaint.status === "cancelled" ? /* @__PURE__ */ jsxs(Button, { type: "button", onClick: onSelect, className: "gradient-brand text-white", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mr-2 h-4 w-4" }),
        "Buat Komplain"
      ] }) : null,
      complaint?.status === "open" || complaint?.status === "seller_responded" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: saving, onClick: onResolve, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
          "Tandai Selesai"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", disabled: saving, onClick: onCancel, children: [
          /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }),
          "Batalkan"
        ] })
      ] }) : null
    ] })
  ] });
}
function EmptyComplaintOrders() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada pesanan yang bisa dikomplain" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Komplain bisa dibuat untuk pesanan yang sudah dikirim atau selesai." }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/pembeli", children: "Kembali ke Dashboard Pembeli" }) })
  ] });
}
function complaintStatusClass(status) {
  if (status === "resolved") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (status === "seller_responded") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }
  if (status === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
export {
  ComplaintRouteSwitcher as component
};
