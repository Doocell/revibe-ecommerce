import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { ArrowLeft, Loader2, RefreshCw, Search, MessageCircle, UserRound } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getAdminChatThreads(filters = {}) {
  const { data, error } = await db.rpc("get_admin_chat_threads", {
    p_search: emptyToNull(filters.search),
    p_limit: filters.limit ?? 300
  });
  if (error) {
    throw new Error(
      error.message.includes("get_admin_chat_threads") ? "RPC get_admin_chat_threads belum tersedia. Jalankan migration SQL fitur admin terlebih dahulu." : error.message
    );
  }
  return (data ?? []).map((row) => ({
    conversation_id: String(row.conversation_id ?? ""),
    buyer_id: String(row.buyer_id ?? ""),
    seller_id: String(row.seller_id ?? ""),
    buyer_name: String(row.buyer_name ?? "Buyer"),
    seller_name: String(row.seller_name ?? "Seller"),
    product_id: row.product_id ? String(row.product_id) : null,
    product_title: String(row.product_title ?? "Produk"),
    product_image: row.product_image ? String(row.product_image) : null,
    last_message: String(row.last_message ?? ""),
    last_sender_id: row.last_sender_id ? String(row.last_sender_id) : null,
    last_message_at: row.last_message_at ? String(row.last_message_at) : null,
    message_count: Number(row.message_count ?? 0),
    unread_count: Number(row.unread_count ?? 0)
  }));
}
async function getAdminChatMessages(conversationId) {
  const cleanConversationId = String(conversationId ?? "").trim();
  if (!cleanConversationId || cleanConversationId === "undefined") {
    throw new Error("ID percakapan tidak valid.");
  }
  const { data, error } = await db.rpc("get_admin_chat_messages", {
    p_conversation_id: cleanConversationId
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: String(row.id ?? ""),
    conversation_id: String(row.conversation_id ?? ""),
    sender_id: String(row.sender_id ?? ""),
    sender_name: String(row.sender_name ?? "User"),
    message: String(row.message ?? ""),
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at ?? "")
  }));
}
function emptyToNull(value) {
  const clean = String(value ?? "").trim();
  return clean ? clean : null;
}
function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
}
function AdminChatPage() {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const activeThread = useMemo(() => {
    return threads.find((thread) => thread.conversation_id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);
  async function loadThreads(nextSearch) {
    setLoadingThreads(true);
    try {
      const rows = await getAdminChatThreads({
        search: nextSearch ?? search,
        limit: 300
      });
      setThreads(rows);
      if (!activeThreadId && rows.length > 0) {
        setActiveThreadId(rows[0].conversation_id);
      }
      if (activeThreadId && !rows.some((thread) => thread.conversation_id === activeThreadId)) {
        setActiveThreadId(rows[0]?.conversation_id ?? "");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat percakapan.");
      console.error("[Load Admin Chat Threads Error]", error);
    } finally {
      setLoadingThreads(false);
    }
  }
  async function loadMessages(conversationId) {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const rows = await getAdminChatMessages(conversationId);
      setMessages(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat isi chat.");
      console.error("[Load Admin Chat Messages Error]", error);
    } finally {
      setLoadingMessages(false);
    }
  }
  useEffect(() => {
    loadThreads("");
  }, []);
  useEffect(() => {
    loadMessages(activeThreadId);
  }, [activeThreadId]);
  function handleReset() {
    setSearch("");
    loadThreads("");
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Monitoring Chat" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau percakapan buyer dan seller untuk kebutuhan moderasi, komplain, dan audit marketplace." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Admin"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => loadThreads(), disabled: loadingThreads, children: [
            loadingThreads ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 lg:grid-cols-[1fr_auto_auto]", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), onKeyDown: (event) => {
            if (event.key === "Enter") loadThreads();
          }, placeholder: "Cari buyer, seller, produk, atau isi pesan...", className: "pl-9" })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "button", onClick: () => loadThreads(), children: "Terapkan" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleReset, children: "Reset" })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid min-h-[640px] gap-6 lg:grid-cols-[380px_1fr]", children: [
        /* @__PURE__ */ jsxs("aside", { className: "rounded-2xl border border-border bg-card", children: [
          /* @__PURE__ */ jsxs("div", { className: "border-b border-border p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Daftar Percakapan" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              threads.length,
              " percakapan ditemukan"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "max-h-[580px] overflow-y-auto p-3", children: loadingThreads ? /* @__PURE__ */ jsx("div", { className: "flex min-h-64 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : threads.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "Belum ada percakapan." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: threads.map((thread) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setActiveThreadId(thread.conversation_id), className: `w-full rounded-xl border p-3 text-left transition ${activeThreadId === thread.conversation_id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary/10", children: thread.product_image ? /* @__PURE__ */ jsx("img", { src: thread.product_image, alt: thread.product_title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-primary", children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5" }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: thread.product_title }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 line-clamp-1 text-xs text-muted-foreground", children: [
                thread.buyer_name,
                " ↔ ",
                thread.seller_name
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 line-clamp-2 text-sm text-muted-foreground", children: thread.last_message || "Belum ada pesan." }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: formatDateTime(thread.last_message_at) }),
                /* @__PURE__ */ jsx("span", { children: "•" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  thread.message_count,
                  " pesan"
                ] })
              ] })
            ] })
          ] }) }, thread.conversation_id)) }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "rounded-2xl border border-border bg-card", children: activeThread ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "border-b border-border p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: activeThread.product_title }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
                "Buyer: ",
                activeThread.buyer_name,
                " • Seller:",
                " ",
                activeThread.seller_name
              ] })
            ] }),
            activeThread.product_id ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${activeThread.product_id}`, children: "Lihat Produk" }) }) : null
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "max-h-[580px] overflow-y-auto p-5", children: loadingMessages ? /* @__PURE__ */ jsx("div", { className: "flex min-h-64 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : messages.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "Belum ada pesan pada percakapan ini." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: messages.map((message) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-background p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(UserRound, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium", children: message.sender_name }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: formatDateTime(message.created_at) })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm leading-6", children: message.message })
            ] })
          ] }) }, message.id)) }) })
        ] }) : /* @__PURE__ */ jsx("div", { className: "flex min-h-[640px] items-center justify-center p-8 text-center", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(MessageCircle, { className: "mx-auto h-10 w-10 text-primary" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Pilih percakapan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Admin dapat membaca riwayat chat buyer dan seller di sini." })
        ] }) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "admin", children: /* @__PURE__ */ jsx(AdminChatPage, {}) });
export {
  SplitComponent as component
};
