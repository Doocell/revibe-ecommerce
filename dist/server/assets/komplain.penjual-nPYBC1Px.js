import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, MessageSquareReply, AlertTriangle, Package, CheckCircle2 } from "lucide-react";
import { u as useAuth, s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { a as complaintReasonLabel, d as getSellerComplaints, b as complaintStatusLabel, r as resolveComplaint, u as updateSellerComplaintResponse } from "./complaints-Ba1Vn0v4.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
function SellerComplaintPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = useState([]);
  const [orderMap, setOrderMap] = useState({});
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [response, setResponse] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const highlightedComplaintId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("complaint") ?? "";
  }, []);
  async function loadComplaints() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getSellerComplaints(user.id);
      setItems(rows);
      const orderIds = rows.map((item) => item.order_id).filter(Boolean);
      if (orderIds.length > 0) {
        const {
          data: orderRows,
          error: orderError
        } = await db.from("orders").select(`
            id,
            buyer_id,
            seller_id,
            order_status,
            payment_status,
            total,
            courier,
            tracking_number,
            shipping_address,
            created_at,
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
          `).eq("seller_id", user.id).in("id", orderIds);
        if (orderError) {
          console.error("[Seller Complaint Orders Load Error]", orderError);
          setOrderMap({});
        } else {
          const nextOrderMap = {};
          (orderRows ?? []).forEach((order) => {
            nextOrderMap[String(order.id)] = order;
          });
          setOrderMap(nextOrderMap);
        }
      } else {
        setOrderMap({});
      }
      if (highlightedComplaintId) {
        window.setTimeout(() => {
          document.getElementById(`seller-complaint-${highlightedComplaintId}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 250);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat komplain.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadComplaints();
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    const channel = db.channel(`seller_complaints_${user.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "order_complaints",
      filter: `seller_id=eq.${user.id}`
    }, () => {
      loadComplaints();
    }).subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id]);
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      const keyword = search.trim().toLowerCase();
      if (!keyword) return true;
      const order = orderMap[item.order_id];
      const productText = (order?.order_items ?? []).map((orderItem) => {
        const product = Array.isArray(orderItem.products) ? orderItem.products[0] : orderItem.products;
        return product?.title ?? "";
      }).join(" ");
      const text = [item.id, item.order_id, item.reason, item.description, item.status, item.seller_response, order?.tracking_number, order?.courier, order?.shipping_address, productText].filter(Boolean).join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [items, search, filter, orderMap]);
  const openCount = items.filter((item) => item.status === "open").length;
  const respondedCount = items.filter((item) => item.status === "seller_responded").length;
  const resolvedCount = items.filter((item) => item.status === "resolved").length;
  async function handleSubmitResponse(event) {
    event.preventDefault();
    if (!user?.id || !selectedComplaint) {
      toast.error("Data komplain tidak valid.");
      return;
    }
    setSaving(true);
    try {
      await updateSellerComplaintResponse({
        sellerId: user.id,
        complaintId: selectedComplaint.id,
        response
      });
      toast.success("Respons seller berhasil dikirim.");
      setSelectedComplaint(null);
      setResponse("");
      await loadComplaints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim respons.");
    } finally {
      setSaving(false);
    }
  }
  async function handleResolve(item) {
    if (!user?.id) return;
    const confirmed = window.confirm("Tandai komplain ini sebagai selesai?");
    if (!confirmed) return;
    setSaving(true);
    try {
      await resolveComplaint({
        userId: user.id,
        complaintId: item.id
      });
      toast.success("Komplain ditandai selesai.");
      await loadComplaints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyelesaikan komplain.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Komplain Buyer" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Lihat, respons, dan selesaikan komplain yang diajukan pembeli." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadComplaints, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual?tab=orders", children: "Kembali ke Pesanan" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsx(StatBox, { label: "Menunggu Respons", value: openCount }),
        /* @__PURE__ */ jsx(StatBox, { label: "Sudah Direspons", value: respondedCount }),
        /* @__PURE__ */ jsx(StatBox, { label: "Selesai", value: resolvedCount })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_240px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari komplain, order ID, alasan, produk, resi...", className: "pl-9" })
          ] }),
          /* @__PURE__ */ jsxs("select", { value: filter, onChange: (event) => setFilter(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
            /* @__PURE__ */ jsx("option", { value: "all", children: "Semua Status" }),
            /* @__PURE__ */ jsx("option", { value: "open", children: "Menunggu Respons" }),
            /* @__PURE__ */ jsx("option", { value: "seller_responded", children: "Sudah Direspons" }),
            /* @__PURE__ */ jsx("option", { value: "resolved", children: "Selesai" }),
            /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Dibatalkan" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : filteredItems.length === 0 ? /* @__PURE__ */ jsx(EmptySellerComplaints, {}) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filteredItems.map((item) => /* @__PURE__ */ jsx(SellerComplaintCard, { item, order: orderMap[item.order_id] ?? null, highlighted: highlightedComplaintId === item.id, saving, onRespond: () => {
          setSelectedComplaint(item);
          setResponse(item.seller_response ?? "");
        }, onResolve: () => handleResolve(item) }, item.id)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {}),
    selectedComplaint ? /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitResponse, className: "w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Respons Komplain" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            "Order ",
            selectedComplaint.order_id
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedComplaint(null), children: "Tutup" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl bg-accent p-4 text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: complaintReasonLabel(selectedComplaint.reason) }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: selectedComplaint.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Respons Seller" }),
        /* @__PURE__ */ jsx(Textarea, { value: response, onChange: (event) => setResponse(event.target.value), rows: 6, placeholder: "Tulis solusi atau penjelasan untuk buyer.", className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedComplaint(null), children: "Batal" }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
          saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(MessageSquareReply, { className: "mr-2 h-4 w-4" }),
          "Kirim Respons"
        ] })
      ] })
    ] }) }) : null
  ] });
}
function SellerComplaintCard({
  item,
  order,
  highlighted,
  saving,
  onRespond,
  onResolve
}) {
  const products = order?.order_items ?? [];
  return /* @__PURE__ */ jsxs("div", { id: `seller-complaint-${item.id}`, className: `rounded-2xl border bg-background p-5 ${highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "font-mono text-sm font-semibold", children: [
          "Komplain ",
          item.id
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Order ",
          item.order_id
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Dibuat: ",
          new Date(item.created_at).toLocaleString("id-ID")
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { className: complaintStatusClass(item.status), children: complaintStatusLabel(item.status) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl bg-accent p-4 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: complaintReasonLabel(item.reason) }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: item.description })
    ] }),
    products.length > 0 ? /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: products.map((orderItem) => {
      const product = Array.isArray(orderItem.products) ? orderItem.products[0] : orderItem.products;
      const image = product?.images?.[0] ?? "";
      return /* @__PURE__ */ jsxs("div", { className: "flex gap-3 rounded-xl border border-border p-3", children: [
        /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${orderItem.product_id}`, className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product?.title ?? "Produk", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${orderItem.product_id}`, className: "font-medium hover:text-primary", children: product?.title ?? "Produk" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
            orderItem.quantity,
            " x ",
            formatIDR(Number(orderItem.price))
          ] })
        ] })
      ] }, orderItem.id);
    }) }) : null,
    order ? /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 rounded-xl border border-border p-4 text-sm md:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Info, { label: "Total Order", value: formatIDR(Number(order.total ?? 0)) }),
      /* @__PURE__ */ jsx(Info, { label: "Kurir", value: order.courier || "-" }),
      /* @__PURE__ */ jsx(Info, { label: "Resi", value: order.tracking_number || "-" })
    ] }) : null,
    item.seller_response ? /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold text-primary", children: "Respons Kamu" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: item.seller_response })
    ] }) : null,
    /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap justify-end gap-2", children: item.status !== "resolved" && item.status !== "cancelled" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onRespond, children: [
        /* @__PURE__ */ jsx(MessageSquareReply, { className: "mr-2 h-4 w-4" }),
        item.seller_response ? "Edit Respons" : "Respons"
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", disabled: saving, onClick: onResolve, className: "gradient-brand text-white", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
        "Tandai Selesai"
      ] })
    ] }) : null })
  ] });
}
function StatBox({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsx(AlertTriangle, { className: "h-6 w-6 text-primary" }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 text-2xl font-bold", children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: label })
  ] });
}
function EmptySellerComplaints() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada komplain" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Komplain buyer akan muncul di sini setelah pembeli mengajukan laporan dari dashboard pembeli." }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual?tab=orders", children: "Kembali ke Pesanan" }) })
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
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerComplaintPage, {}) });
export {
  SplitComponent as component
};
