import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, u as useAuth, N as Navbar, F as Footer, B as Button } from "./Navbar-BfYtpR_3.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { Loader2, MessageCircle, RefreshCw, ShoppingBag, Send } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
async function getMyConversations(userId) {
  const { data, error } = await supabase.from("chat_conversations").select(
    `
      *,
      products(id, title, images, price, seller_id, status)
    `
  ).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const conversations = data ?? [];
  const counterpartIds = Array.from(
    new Set(
      conversations.map(
        (conversation) => conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id
      )
    )
  );
  if (counterpartIds.length === 0) {
    return conversations.map((conversation) => ({
      ...conversation,
      counterpart: null
    }));
  }
  const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name, shop_name, whatsapp").in("id", counterpartIds);
  if (profileError) {
    console.error("[Chat Profile Error]", profileError);
    return conversations.map((conversation) => ({
      ...conversation,
      counterpart: null
    }));
  }
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  return conversations.map((conversation) => {
    const counterpartId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
    return {
      ...conversation,
      counterpart: profileMap.get(counterpartId) ?? null
    };
  });
}
async function getConversationMessages(conversationId) {
  const { data, error } = await supabase.from("chat_messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
async function sendChatMessage({
  conversationId,
  senderId,
  message
}) {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    throw new Error("Pesan tidak boleh kosong.");
  }
  const { data, error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    message: cleanMessage
  }).select("*").single();
  if (error) throw new Error(error.message);
  const { error: updateError } = await supabase.from("chat_conversations").update({
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", conversationId);
  if (updateError) {
    console.error("[Update Conversation Time Error]", updateError);
  }
  return data;
}
async function markConversationRead({
  conversationId,
  userId
}) {
  const { error } = await supabase.from("chat_messages").update({
    is_read: true
  }).eq("conversation_id", conversationId).neq("sender_id", userId);
  if (error) {
    console.error("[Mark Chat Read Error]", error);
  }
}
function getConversationTitle(conversation, currentUserId) {
  const isSeller = conversation.seller_id === currentUserId;
  if (isSeller) {
    return conversation.counterpart?.full_name || "Pembeli ReVibe";
  }
  return conversation.counterpart?.shop_name || conversation.counterpart?.full_name || "Penjual ReVibe";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
function ChatPage() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [conversationLoading, setConversationLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  }, [conversations, activeConversationId]);
  async function loadConversations() {
    if (!user) {
      setConversationLoading(false);
      return;
    }
    setConversationLoading(true);
    try {
      const rows = await getMyConversations(user.id);
      setConversations(rows);
      const queryConversationId = new URLSearchParams(window.location.search).get("conversation");
      if (queryConversationId && rows.some((conversation) => conversation.id === queryConversationId)) {
        setActiveConversationId(queryConversationId);
      } else if (!activeConversationId && rows.length > 0) {
        setActiveConversationId(rows[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat percakapan.");
      console.error("[Load Conversations Error]", error);
    } finally {
      setConversationLoading(false);
    }
  }
  async function loadMessages(conversationId) {
    if (!user || !conversationId) return;
    setMessageLoading(true);
    try {
      const rows = await getConversationMessages(conversationId);
      setMessages(rows);
      await markConversationRead({
        conversationId,
        userId: user.id
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat pesan.");
      console.error("[Load Messages Error]", error);
    } finally {
      setMessageLoading(false);
    }
  }
  useEffect(() => {
    if (!authLoading) {
      loadConversations();
    }
  }, [authLoading, user]);
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);
  useEffect(() => {
    if (!activeConversationId) return;
    const interval = window.setInterval(() => {
      loadMessages(activeConversationId);
    }, 3e3);
    return () => window.clearInterval(interval);
  }, [activeConversationId, user]);
  async function handleSendMessage(event) {
    event.preventDefault();
    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }
    if (!activeConversationId) {
      toast.error("Pilih percakapan terlebih dahulu.");
      return;
    }
    if (!messageInput.trim()) {
      toast.error("Pesan tidak boleh kosong.");
      return;
    }
    setSending(true);
    try {
      const sentMessage = await sendChatMessage({
        conversationId: activeConversationId,
        senderId: user.id,
        message: messageInput
      });
      setMessages((current) => [...current, sentMessage]);
      setMessageInput("");
      await loadConversations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim pesan.");
      console.error("[Send Message Error]", error);
    } finally {
      setSending(false);
    }
  }
  if (authLoading || conversationLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  if (!user) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(MessageCircle, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Chat ReVibe" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login terlebih dahulu untuk membuka percakapan." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login Pembeli" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/login/penjual", children: "Login Penjual" }) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Chat" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pembeli bisa menanyakan detail barang, sedangkan penjual bisa membalas pertanyaan pembeli dari halaman ini." })
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: loadConversations, children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
          "Refresh"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid min-h-[620px] gap-6 lg:grid-cols-[340px_1fr]", children: [
        /* @__PURE__ */ jsxs("aside", { className: "rounded-2xl border border-border bg-card", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b border-border p-4", children: /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Percakapan" }) }),
          /* @__PURE__ */ jsx("div", { className: "max-h-[560px] overflow-y-auto p-3", children: conversations.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "Belum ada percakapan. Pembeli harus membuka detail produk lalu klik Chat Penjual terlebih dahulu." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: conversations.map((conversation) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setActiveConversationId(conversation.id), className: `w-full rounded-xl border p-3 text-left transition ${activeConversationId === conversation.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted", children: conversation.products?.images?.[0] ? /* @__PURE__ */ jsx("img", { src: conversation.products.images[0], alt: conversation.products.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-semibold", children: getConversationTitle(conversation, user.id) }),
              /* @__PURE__ */ jsx("div", { className: "line-clamp-1 text-sm text-muted-foreground", children: conversation.products?.title ?? "Produk" }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs font-medium text-primary", children: conversation.products ? formatIDR(Number(conversation.products.price)) : "-" })
            ] })
          ] }) }, conversation.id)) }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "flex min-h-[620px] flex-col rounded-2xl border border-border bg-card", children: !activeConversation ? /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-center justify-center p-8 text-center", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(MessageCircle, { className: "mx-auto h-10 w-10 text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Pilih percakapan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Pilih percakapan di sisi kiri untuk mulai membalas chat." })
        ] }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "border-b border-border p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "h-6 w-6" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: getConversationTitle(activeConversation, user.id) }),
              /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${activeConversation.product_id}`, className: "line-clamp-1 text-sm text-primary hover:underline", children: activeConversation.products?.title ?? "Lihat produk" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 space-y-3 overflow-y-auto p-4", children: messageLoading ? /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : messages.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-center text-sm text-muted-foreground", children: "Belum ada pesan. Mulai percakapan dari kolom pesan di bawah." }) : messages.map((message) => {
            const isMine = message.sender_id === user.id;
            return /* @__PURE__ */ jsx("div", { className: `flex ${isMine ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs("div", { className: `max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`, children: [
              /* @__PURE__ */ jsx("div", { className: "whitespace-pre-line", children: message.message }),
              /* @__PURE__ */ jsx("div", { className: `mt-1 text-[10px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`, children: new Date(message.created_at).toLocaleString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short"
              }) })
            ] }) }, message.id);
          }) }),
          /* @__PURE__ */ jsx("form", { onSubmit: handleSendMessage, className: "border-t border-border p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(Textarea, { value: messageInput, onChange: (event) => setMessageInput(event.target.value), placeholder: "Tulis pesan balasan...", rows: 2 }),
            /* @__PURE__ */ jsx(Button, { type: "submit", disabled: sending, className: "self-end gradient-brand text-white", children: sending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }) })
          ] }) })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
export {
  ChatPage as component
};
