import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { ArrowLeft, Loader2, RefreshCw, CheckCheck, Search, Package, CheckCircle2, Bell, MessageCircle, XCircle, Truck, ShoppingBag } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getSystemNotifications(filters = {}) {
  if (filters.isAdmin) {
    const { data: data2, error: error2 } = await db.rpc("get_admin_system_notifications", {
      p_search: emptyToNull(filters.search),
      p_type: emptyToNull(filters.type),
      p_limit: filters.limit ?? 200
    });
    if (error2) {
      throw new Error(
        error2.message.includes("get_admin_system_notifications") ? "RPC get_admin_system_notifications belum tersedia. Jalankan SQL notifikasi sistem terlebih dahulu." : error2.message
      );
    }
    return (data2 ?? []).map(normalizeNotification);
  }
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;
  if (!userId) {
    return [];
  }
  const { data, error } = await db.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(filters.limit ?? 200);
  if (error) {
    console.warn("[User Notifications Fallback]", error.message);
    return [];
  }
  let rows = (data ?? []).map(normalizeNotification);
  const search = String(filters.search ?? "").trim().toLowerCase();
  const type = String(filters.type ?? "").trim();
  if (type && type !== "all") {
    rows = rows.filter((item) => item.type === type);
  }
  if (search) {
    rows = rows.filter(
      (item) => `${item.title} ${item.message} ${item.entity_id ?? ""}`.toLowerCase().includes(search)
    );
  }
  return rows;
}
async function markSystemNotificationRead({
  notificationId,
  isAdmin
}) {
  if (!notificationId) {
    throw new Error("ID notifikasi tidak valid.");
  }
  if (isAdmin) {
    const { error: error2 } = await db.rpc("mark_admin_system_notification_read", {
      p_notification_id: notificationId
    });
    if (error2) {
      throw new Error(error2.message);
    }
    return;
  }
  const { error } = await db.from("notifications").update({
    is_read: true
  }).eq("id", notificationId);
  if (error) {
    throw new Error(error.message);
  }
}
async function markAllSystemNotificationsRead({
  isAdmin
}) {
  if (isAdmin) {
    const { error: error2 } = await db.rpc("mark_all_admin_system_notifications_read");
    if (error2) {
      throw new Error(error2.message);
    }
    return;
  }
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;
  if (!userId) {
    return;
  }
  const { error } = await db.from("notifications").update({
    is_read: true
  }).eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
}
function normalizeNotification(row) {
  return {
    id: String(row.id ?? ""),
    type: normalizeType(row.type),
    title: String(row.title ?? "Notifikasi"),
    message: String(row.message ?? ""),
    entity_type: row.entity_type ? String(row.entity_type) : null,
    entity_id: row.entity_id ? String(row.entity_id) : null,
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at ?? (/* @__PURE__ */ new Date()).toISOString())
  };
}
function normalizeType(value) {
  const clean = String(value ?? "system");
  if ([
    "order",
    "payment",
    "shipping",
    "cancel",
    "product",
    "review",
    "chat",
    "system"
  ].includes(clean)) {
    return clean;
  }
  return "system";
}
function emptyToNull(value) {
  const clean = String(value ?? "").trim();
  return clean && clean !== "all" ? clean : null;
}
function notificationTypeLabel(type) {
  const labels = {
    order: "Order",
    payment: "Pembayaran",
    shipping: "Pengiriman",
    cancel: "Pembatalan",
    product: "Produk",
    review: "Ulasan",
    chat: "Chat",
    system: "Sistem"
  };
  return labels[type] ?? "Sistem";
}
function formatNotificationDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("id-ID");
}
const typeOptions = [{
  value: "",
  label: "Semua"
}, {
  value: "order",
  label: "Order"
}, {
  value: "payment",
  label: "Pembayaran"
}, {
  value: "shipping",
  label: "Pengiriman"
}, {
  value: "cancel",
  label: "Pembatalan"
}, {
  value: "product",
  label: "Produk"
}, {
  value: "chat",
  label: "Chat"
}, {
  value: "review",
  label: "Ulasan"
}, {
  value: "system",
  label: "Sistem"
}];
function NotificationsPage() {
  const {
    roles,
    loading: authLoading
  } = useAuth();
  const isAdmin = roles.includes("admin");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  async function loadNotifications(next) {
    setLoading(true);
    try {
      const rows = await getSystemNotifications({
        isAdmin,
        search: next?.search ?? search,
        type: next?.type ?? type,
        limit: 250
      });
      setNotifications(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat notifikasi.");
      console.error("[Load Notifications Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!authLoading) {
      loadNotifications({
        search: "",
        type: ""
      });
    }
  }, [authLoading, isAdmin]);
  function handleReset() {
    setSearch("");
    setType("");
    loadNotifications({
      search: "",
      type: ""
    });
  }
  async function handleMarkRead(notification) {
    if (notification.is_read) return;
    setUpdatingId(notification.id);
    try {
      await markSystemNotificationRead({
        notificationId: notification.id,
        isAdmin
      });
      setNotifications((current) => current.map((item) => item.id === notification.id ? {
        ...item,
        is_read: true
      } : item));
      toast.success("Notifikasi ditandai sudah dibaca.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menandai notifikasi.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllSystemNotificationsRead({
        isAdmin
      });
      setNotifications((current) => current.map((item) => ({
        ...item,
        is_read: true
      })));
      toast.success("Semua notifikasi ditandai sudah dibaca.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menandai semua notifikasi.");
    } finally {
      setMarkingAll(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: isAdmin ? "Notifikasi Sistem" : "Notifikasi" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau order, pengiriman, produk, ulasan, dan chat." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          isAdmin ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Admin"
          ] }) }) : null,
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => loadNotifications(), disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: handleMarkAllRead, disabled: markingAll || unreadCount === 0, children: [
            markingAll ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCheck, { className: "mr-2 h-4 w-4" }),
            "Tandai Semua Dibaca"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), onKeyDown: (event) => {
              if (event.key === "Enter") {
                loadNotifications();
              }
            }, placeholder: "Cari notifikasi...", className: "pl-9" })
          ] }),
          /* @__PURE__ */ jsx("select", { value: type, onChange: (event) => setType(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: typeOptions.map((item) => /* @__PURE__ */ jsx("option", { value: item.value, children: item.label }, item.value)) }),
          /* @__PURE__ */ jsx(Button, { type: "button", onClick: () => loadNotifications(), disabled: loading, children: "Terapkan" }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleReset, disabled: loading, children: "Reset" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: authLoading || loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : notifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
          /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada notifikasi" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Notifikasi order, produk, pengiriman, ulasan, dan chat akan muncul di sini." })
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: notifications.map((notification) => /* @__PURE__ */ jsx(NotificationCard, { notification, updating: updatingId === notification.id, onMarkRead: () => handleMarkRead(notification) }, notification.id)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function NotificationCard({
  notification,
  updating,
  onMarkRead
}) {
  const Icon = getNotificationIcon(notification.type);
  return /* @__PURE__ */ jsx("div", { className: `rounded-2xl border p-4 transition ${notification.is_read ? "border-border bg-background" : "border-primary/40 bg-primary/5"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: `flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${notification.is_read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: notification.title }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: notificationTypeLabel(notification.type) }),
          !notification.is_read ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800", children: "Baru" }) : null
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-6 text-muted-foreground", children: notification.message || "-" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: formatNotificationDate(notification.created_at) }),
          notification.entity_id ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: "•" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "ID: ",
              notification.entity_id
            ] })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(EntityLink, { notification }) })
      ] })
    ] }),
    !notification.is_read ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: updating, onClick: onMarkRead, children: [
      updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
      "Tandai Dibaca"
    ] }) : null
  ] }) });
}
function EntityLink({
  notification
}) {
  if (notification.entity_type === "order") {
    return /* @__PURE__ */ jsx("a", { href: "/dashboard/admin/transaksi", className: "text-sm font-medium text-primary hover:underline", children: "Buka Monitoring Transaksi →" });
  }
  if (notification.entity_type === "product" && notification.entity_id) {
    return /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${notification.entity_id}`, className: "text-sm font-medium text-primary hover:underline", children: "Lihat Produk →" });
  }
  if (notification.entity_type === "chat") {
    return /* @__PURE__ */ jsx("a", { href: "/dashboard/admin/chat", className: "text-sm font-medium text-primary hover:underline", children: "Buka Monitoring Chat →" });
  }
  return null;
}
function getNotificationIcon(type) {
  const icons = {
    order: ShoppingBag,
    payment: CheckCircle2,
    shipping: Truck,
    cancel: XCircle,
    product: Package,
    review: Bell,
    chat: MessageCircle,
    system: Bell
  };
  return icons[type] ?? Bell;
}
export {
  NotificationsPage as component
};
