import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Facebook, Mail, Bell, Heart, MessageCircle, ShoppingCart, MapPin, UserRound, LogOut, X, Menu } from "lucide-react";
import * as React from "react";
import { useState, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@supabase/supabase-js";
const logo = "/assets/Revibe-logo-foUsLoX5.png";
function Logo({ className = "h-8 md:h-9" }) {
  return /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("img", { src: logo, alt: "ReVibe", className: `${className} w-auto object-contain` }) });
}
function Footer() {
  return /* @__PURE__ */ jsxs("footer", { className: "border-t border-border bg-muted/40", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Logo, {}),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Marketplace barang preloved Indonesia. Belanja dan jual barang bekas layak pakai dengan aman, mudah, dan terpercaya." }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsx("a", { href: "#", "aria-label": "Instagram", children: /* @__PURE__ */ jsx(Instagram, { className: "h-5 w-5 hover:text-primary" }) }),
          /* @__PURE__ */ jsx("a", { href: "#", "aria-label": "Twitter", children: /* @__PURE__ */ jsx(Twitter, { className: "h-5 w-5 hover:text-primary" }) }),
          /* @__PURE__ */ jsx("a", { href: "#", "aria-label": "Facebook", children: /* @__PURE__ */ jsx(Facebook, { className: "h-5 w-5 hover:text-primary" }) }),
          /* @__PURE__ */ jsx("a", { href: "#", "aria-label": "Email", children: /* @__PURE__ */ jsx(Mail, { className: "h-5 w-5 hover:text-primary" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "mb-3 text-sm font-semibold", children: "Jelajahi" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-primary", children: "Beranda" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/kategori", className: "hover:text-primary", children: "Kategori" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/produk", className: "hover:text-primary", children: "Produk Preloved" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/tentang", className: "hover:text-primary", children: "Tentang Kami" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "mb-3 text-sm font-semibold", children: "Akun" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/login/pembeli", className: "hover:text-primary", children: "Masuk Pembeli" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/register/pembeli", className: "hover:text-primary", children: "Daftar Pembeli" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/login/penjual", className: "hover:text-primary", children: "Masuk Penjual" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/register/penjual", className: "hover:text-primary", children: "Daftar Penjual" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "mb-3 text-sm font-semibold", children: "Bantuan" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx("li", { children: "Pusat Bantuan" }),
          /* @__PURE__ */ jsx("li", { children: "Kebijakan Privasi" }),
          /* @__PURE__ */ jsx("li", { children: "Syarat & Ketentuan" }),
          /* @__PURE__ */ jsx("li", { children: "Hubungi Kami" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-border py-5 text-center text-xs text-muted-foreground", children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " ReVibe. Marketplace preloved Indonesia."
    ] })
  ] });
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
function createSupabaseClient() {
  const SUPABASE_URL = "https://pqpqqxibdsgymiiunzav.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcHFxeGliZHNneW1paXVuemF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODc2NTQsImV4cCI6MjA5NTM2MzY1NH0.CbFeq8OQPpwpqZB9AZnu5p0x2GozXGu7GyjZfpO3qUA";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
const db$2 = supabase;
async function getUserRoles(userId) {
  const { data, error } = await db$2.from("user_roles").select("role").eq("user_id", userId);
  if (error) {
    console.error("[Get User Roles Error]", error);
    return [];
  }
  return (data ?? []).map((row) => row.role).filter(
    (role) => ["buyer", "seller", "admin"].includes(role)
  );
}
function useAuth() {
  const [state, setState] = useState({
    user: null,
    roles: [],
    loading: true
  });
  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.error("[Get Session Error]", error);
        setState({
          user: null,
          roles: [],
          loading: false
        });
        return;
      }
      const user = session?.user ?? null;
      if (!user) {
        setState({
          user: null,
          roles: [],
          loading: false
        });
        return;
      }
      const roles = await getUserRoles(user.id);
      if (!mounted) return;
      setState({
        user,
        roles,
        loading: false
      });
    }
    loadSession();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!user) {
        setState({
          user: null,
          roles: [],
          loading: false
        });
        return;
      }
      setState((current) => ({
        ...current,
        user,
        loading: true
      }));
      setTimeout(async () => {
        const roles = await getUserRoles(user.id);
        if (!mounted) return;
        setState({
          user,
          roles,
          loading: false
        });
      }, 0);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  return state;
}
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Sign Out Error]", error);
  }
  window.location.href = "/";
}
const db$1 = supabase;
async function getMyNotifications(limit = 30) {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await db$1.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(normalizeNotification);
}
async function getUnreadNotificationCount() {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  const { count, error } = await db$1.from("notifications").select("id", {
    count: "exact",
    head: true
  }).eq("user_id", userId).eq("is_read", false);
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}
async function markNotificationAsRead(notificationId) {
  const userId = await getCurrentUserId();
  if (!userId || !notificationId) return;
  const { error } = await db$1.from("notifications").update({
    is_read: true,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", notificationId).eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
}
async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[Get Current User Error]", error);
    return "";
  }
  return data.user?.id ?? "";
}
function normalizeNotification(row) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? "Notifikasi"),
    message: row.message ?? null,
    type: row.type ?? null,
    is_read: Boolean(row.is_read),
    order_id: row.order_id ?? null,
    product_id: row.product_id ?? null,
    conversation_id: row.conversation_id ?? null,
    target_url: row.target_url ?? null,
    metadata: row.metadata ?? null,
    created_at: row.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: row.updated_at ?? null
  };
}
const db = supabase;
const links = [
  { to: "/", label: "Beranda" },
  { to: "/kategori", label: "Kategori" },
  { to: "/produk", label: "Produk Preloved" },
  { to: "/tentang", label: "Tentang Kami" }
];
function Navbar() {
  const { user, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [chatPreview, setChatPreview] = useState([]);
  const [cartPreview, setCartPreview] = useState([]);
  const [loadingNotifPreview, setLoadingNotifPreview] = useState(false);
  const [loadingChatPreview, setLoadingChatPreview] = useState(false);
  const [loadingCartPreview, setLoadingCartPreview] = useState(false);
  const safeRoles = roles ?? [];
  const isBuyer = safeRoles.includes("buyer");
  const isSeller = safeRoles.includes("seller");
  const isAdmin = safeRoles.includes("admin");
  const canUseChat = isBuyer || isSeller;
  const dashHref = isAdmin ? "/dashboard/admin" : isSeller ? "/dashboard/penjual" : isBuyer ? "/dashboard/pembeli" : null;
  async function loadNotificationCount() {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    try {
      const count = await getUnreadNotificationCount(user.id);
      setNotificationCount(count);
    } catch (error) {
      console.error("[Navbar Notification Count Error]", error);
    }
  }
  async function loadNotificationPreview() {
    if (!user || loadingNotifPreview) return;
    setLoadingNotifPreview(true);
    try {
      const [count, rows] = await Promise.all([
        getUnreadNotificationCount(user.id),
        getMyNotifications(user.id)
      ]);
      setNotificationCount(count);
      setRecentNotifications(rows.slice(0, 5));
    } catch (error) {
      console.error("[Navbar Notification Preview Error]", error);
    } finally {
      setLoadingNotifPreview(false);
    }
  }
  async function loadChatPreview() {
    if (!user || !canUseChat || loadingChatPreview) return;
    setLoadingChatPreview(true);
    try {
      const { data: conversations, error: conversationError } = await db.from("chat_conversations").select("id, buyer_id, seller_id, created_at").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(5);
      if (conversationError) {
        throw new Error(conversationError.message);
      }
      const conversationRows = conversations ?? [];
      const conversationIds = conversationRows.map(
        (conversation) => conversation.id
      );
      if (conversationIds.length === 0) {
        setChatPreview([]);
        return;
      }
      const { data: messages, error: messageError } = await db.from("chat_messages").select("id, conversation_id, sender_id, message, created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false });
      if (messageError) {
        throw new Error(messageError.message);
      }
      const messageRows = messages ?? [];
      const latestMessageMap = /* @__PURE__ */ new Map();
      for (const message of messageRows) {
        if (!latestMessageMap.has(message.conversation_id)) {
          latestMessageMap.set(message.conversation_id, message);
        }
      }
      const preview = conversationRows.map((conversation) => {
        const latestMessage = latestMessageMap.get(conversation.id);
        return {
          id: conversation.id,
          lastMessage: latestMessage?.message ?? "Belum ada pesan",
          createdAt: latestMessage?.created_at ?? null
        };
      });
      setChatPreview(preview);
    } catch (error) {
      console.error("[Navbar Chat Preview Error]", error);
      setChatPreview([]);
    } finally {
      setLoadingChatPreview(false);
    }
  }
  async function loadCartPreview() {
    if (!user || !isBuyer || loadingCartPreview) return;
    setLoadingCartPreview(true);
    try {
      const { data, error } = await db.from("cart_items").select(
        `
          id,
          product_id,
          quantity,
          products(
            id,
            title,
            price,
            images
          )
        `
      ).eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(5);
      if (error) {
        throw new Error(error.message);
      }
      const rows = data ?? [];
      const preview = rows.map((item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        return {
          id: item.id,
          productId: item.product_id,
          quantity: Number(item.quantity ?? 0),
          productTitle: product?.title ?? "Produk",
          productImage: product?.images?.[0] ?? null,
          productPrice: Number(product?.price ?? 0)
        };
      });
      const total = rows.reduce((sum, item) => {
        return sum + Number(item.quantity ?? 0);
      }, 0);
      setCartPreview(preview);
      setCartCount(total);
    } catch (error) {
      console.error("[Navbar Cart Preview Error]", error);
      setCartPreview([]);
      setCartCount(0);
    } finally {
      setLoadingCartPreview(false);
    }
  }
  async function loadCartCount() {
    if (!user || !isBuyer) {
      setCartCount(0);
      setCartPreview([]);
      return;
    }
    const { data, error } = await db.from("cart_items").select("quantity").eq("buyer_id", user.id);
    if (error) {
      console.error("[Navbar Cart Count Error]", error);
      setCartCount(0);
      return;
    }
    const total = (data ?? []).reduce((sum, item) => {
      return sum + Number(item.quantity ?? 0);
    }, 0);
    setCartCount(total);
  }
  useEffect(() => {
    loadCartCount();
    function handleCartUpdated() {
      loadCartCount();
      loadCartPreview();
    }
    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("focus", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("focus", handleCartUpdated);
    };
  }, [user?.id, isBuyer]);
  useEffect(() => {
    if (!user?.id || !isBuyer) return;
    const channel = db.channel(`navbar_cart_${user.id}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cart_items",
        filter: `buyer_id=eq.${user.id}`
      },
      () => {
        loadCartCount();
        loadCartPreview();
      }
    ).subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id, isBuyer]);
  useEffect(() => {
    loadNotificationCount();
    const interval = window.setInterval(() => {
      loadNotificationCount();
    }, 5e3);
    return () => window.clearInterval(interval);
  }, [user?.id]);
  return /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto flex h-16 items-center justify-between px-4", children: [
      /* @__PURE__ */ jsx(Logo, {}),
      /* @__PURE__ */ jsx("nav", { className: "hidden items-center gap-1 md:flex", children: links.map((link) => /* @__PURE__ */ jsx(
        Link,
        {
          to: link.to,
          className: "rounded-md px-3 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-accent-foreground",
          activeProps: {
            className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-accent"
          },
          children: link.label
        },
        link.to
      )) }),
      /* @__PURE__ */ jsx("div", { className: "hidden items-center gap-2 md:flex", children: user ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          NavPopup,
          {
            onOpen: loadNotificationPreview,
            popup: /* @__PURE__ */ jsx(
              NotificationPopup,
              {
                loading: loadingNotifPreview,
                items: recentNotifications,
                unreadCount: notificationCount
              }
            ),
            children: /* @__PURE__ */ jsx(
              Button,
              {
                asChild: true,
                variant: "outline",
                size: "icon",
                "aria-label": "Notifikasi",
                title: "Notifikasi",
                children: /* @__PURE__ */ jsxs("a", { href: "/notifikasi", className: "relative", children: [
                  /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
                  notificationCount > 0 ? /* @__PURE__ */ jsx("span", { className: "absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground", children: notificationCount }) : null
                ] })
              }
            )
          }
        ),
        isBuyer ? /* @__PURE__ */ jsx(
          Button,
          {
            asChild: true,
            variant: "outline",
            size: "icon",
            title: "Wishlist",
            "aria-label": "Wishlist",
            children: /* @__PURE__ */ jsx("a", { href: "/wishlist", children: /* @__PURE__ */ jsx(Heart, { className: "h-4 w-4" }) })
          }
        ) : null,
        canUseChat ? /* @__PURE__ */ jsx(
          NavPopup,
          {
            onOpen: loadChatPreview,
            popup: /* @__PURE__ */ jsx(
              ChatPopup,
              {
                loading: loadingChatPreview,
                items: chatPreview
              }
            ),
            children: /* @__PURE__ */ jsx(
              Button,
              {
                asChild: true,
                variant: "outline",
                size: "icon",
                "aria-label": "Pesan",
                title: "Pesan",
                children: /* @__PURE__ */ jsx("a", { href: "/chat", children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }) })
              }
            )
          }
        ) : null,
        isBuyer ? /* @__PURE__ */ jsx(
          NavPopup,
          {
            onOpen: loadCartPreview,
            popup: /* @__PURE__ */ jsx(
              CartPopup,
              {
                loading: loadingCartPreview,
                items: cartPreview,
                totalCount: cartCount
              }
            ),
            children: /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxs("a", { href: "/keranjang", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "mr-1 h-4 w-4" }),
              "Keranjang",
              cartCount > 0 ? /* @__PURE__ */ jsx("span", { className: "ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground", children: cartCount }) : null
            ] }) })
          }
        ) : null,
        isBuyer ? /* @__PURE__ */ jsx(
          Button,
          {
            asChild: true,
            variant: "outline",
            size: "icon",
            title: "Alamat Pengiriman",
            "aria-label": "Alamat Pengiriman",
            children: /* @__PURE__ */ jsx("a", { href: "/alamat", children: /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }) })
          }
        ) : null,
        dashHref ? /* @__PURE__ */ jsx(
          Button,
          {
            asChild: true,
            variant: "outline",
            size: "icon",
            title: "Dashboard",
            "aria-label": "Dashboard",
            children: /* @__PURE__ */ jsx("a", { href: dashHref, children: /* @__PURE__ */ jsx(UserRound, { className: "h-4 w-4" }) })
          }
        ) : null,
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "icon",
            variant: "ghost",
            title: "Keluar",
            "aria-label": "Keluar",
            onClick: () => signOut(),
            children: /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" })
          }
        )
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "sm", children: /* @__PURE__ */ jsx(Link, { to: "/login/pembeli", children: "Masuk" }) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            asChild: true,
            size: "sm",
            className: "gradient-brand text-white shadow-brand",
            children: /* @__PURE__ */ jsx(Link, { to: "/register/pembeli", children: "Daftar" })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setOpen((current) => !current),
          className: "md:hidden",
          "aria-label": "Menu",
          type: "button",
          children: open ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(Menu, { className: "h-6 w-6" })
        }
      )
    ] }),
    open ? /* @__PURE__ */ jsx("div", { className: "border-t border-border bg-background md:hidden", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto flex flex-col gap-1 px-4 py-3", children: [
      links.map((link) => /* @__PURE__ */ jsx(
        Link,
        {
          to: link.to,
          onClick: () => setOpen(false),
          className: "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: link.label
        },
        link.to
      )),
      user ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/notifikasi",
          onClick: () => setOpen(false),
          className: "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
              "Notifikasi"
            ] }),
            notificationCount > 0 ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground", children: notificationCount }) : null
          ]
        }
      ) : null,
      user && isBuyer ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/wishlist",
          onClick: () => setOpen(false),
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsx(Heart, { className: "h-4 w-4" }),
            "Wishlist"
          ]
        }
      ) : null,
      user && canUseChat ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/chat",
          onClick: () => setOpen(false),
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
            "Pesan"
          ]
        }
      ) : null,
      user && isBuyer ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/keranjang",
          onClick: () => setOpen(false),
          className: "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "h-4 w-4" }),
              "Keranjang"
            ] }),
            cartCount > 0 ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground", children: cartCount }) : null
          ]
        }
      ) : null,
      user && isBuyer ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/alamat",
          onClick: () => setOpen(false),
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
            "Alamat Pengiriman"
          ]
        }
      ) : null,
      user && dashHref ? /* @__PURE__ */ jsxs(
        "a",
        {
          href: dashHref,
          onClick: () => setOpen(false),
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsx(UserRound, { className: "h-4 w-4" }),
            "Dashboard"
          ]
        }
      ) : null,
      user ? /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => signOut(),
          className: "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent",
          children: [
            /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
            "Keluar"
          ]
        }
      ) : null,
      !user ? /* @__PURE__ */ jsxs("div", { className: "mt-2 flex gap-2 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", className: "flex-1", children: /* @__PURE__ */ jsx(Link, { to: "/login/pembeli", children: "Masuk" }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "flex-1 gradient-brand text-white", children: /* @__PURE__ */ jsx(Link, { to: "/register/pembeli", children: "Daftar" }) })
      ] }) : null
    ] }) }) : null
  ] });
}
function NavPopup({
  children,
  popup,
  onOpen
}) {
  return /* @__PURE__ */ jsxs("div", { className: "group relative inline-flex", onMouseEnter: onOpen, children: [
    children,
    /* @__PURE__ */ jsx("div", { className: "invisible absolute right-0 top-full z-50 mt-3 w-80 translate-y-2 rounded-xl border border-border bg-background p-0 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100", children: popup })
  ] });
}
function CartPopup({
  loading,
  items,
  totalCount
}) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.productPrice * item.quantity;
  }, 0);
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b border-border px-4 py-3", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Keranjang" }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: totalCount > 0 ? `${totalCount} produk di keranjang` : "Keranjang masih kosong" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto p-2", children: loading ? /* @__PURE__ */ jsx("div", { className: "px-4 py-8 text-center text-sm text-muted-foreground", children: "Memuat keranjang..." }) : items.length === 0 ? /* @__PURE__ */ jsx(EmptyPopupText, { text: "Belum ada produk", icon: "cart" }) : items.map((item) => /* @__PURE__ */ jsxs(
      "a",
      {
        href: `/detail-produk?id=${item.productId}`,
        className: "flex gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-accent",
        children: [
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted", children: item.productImage ? /* @__PURE__ */ jsx(
            "img",
            {
              src: item.productImage,
              alt: item.productTitle,
              className: "h-full w-full object-cover"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: item.productTitle }),
            /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-xs text-muted-foreground", children: [
              item.quantity,
              " x ",
              formatIDR(item.productPrice)
            ] })
          ] })
        ]
      },
      item.id
    )) }),
    items.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "border-t border-border px-4 py-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatIDR(subtotal) })
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/keranjang",
          className: "block rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90",
          children: "Lihat Keranjang"
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "border-t border-border p-2", children: /* @__PURE__ */ jsx(
      "a",
      {
        href: "/produk",
        className: "block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent",
        children: "Mulai Belanja"
      }
    ) })
  ] });
}
function NotificationPopup({
  loading,
  items,
  unreadCount
}) {
  async function handleClickNotification(item) {
    const targetUrl = resolveNavbarNotificationTarget(item);
    try {
      if (!item.is_read) {
        await markNotificationAsRead(item.id);
      }
    } catch (error) {
      console.error("[Navbar Mark Notification Read Error]", error);
    } finally {
      openNotificationTarget(targetUrl);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b border-border px-4 py-3", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Notifikasi" }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: unreadCount > 0 ? `${unreadCount} belum dibaca` : "Tidak ada notifikasi baru" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto p-2", children: loading ? /* @__PURE__ */ jsx("div", { className: "px-4 py-8 text-center text-sm text-muted-foreground", children: "Memuat notifikasi..." }) : items.length === 0 ? /* @__PURE__ */ jsx(EmptyPopupText, { text: "Belum ada notifikasi", icon: "notification" }) : items.map((item) => {
      const targetUrl = resolveNavbarNotificationTarget(item);
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleClickNotification(item),
          className: `block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent ${item.is_read ? "" : "bg-primary/5"}`,
          title: `Buka: ${targetUrl}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: item.title }),
              /* @__PURE__ */ jsx("div", { className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground", children: item.message }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: new Date(item.created_at).toLocaleString("id-ID") })
            ] }),
            !item.is_read ? /* @__PURE__ */ jsx("span", { className: "mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" }) : null
          ] })
        },
        item.id
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-border p-2", children: /* @__PURE__ */ jsx(
      "a",
      {
        href: "/notifikasi",
        className: "block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent",
        children: "Lihat Semua Notifikasi"
      }
    ) })
  ] });
}
function resolveNavbarNotificationTarget(item) {
  const rawTargetUrl = String(item.target_url ?? "").trim();
  const title = String(item.title ?? "").toLowerCase();
  const message = String(item.message ?? "").toLowerCase();
  const type = String(item.type ?? "").toLowerCase();
  const combined = `${title} ${message} ${type}`;
  const orderId = "order_id" in item && item.order_id ? String(item.order_id) : "";
  const productId = "product_id" in item && item.product_id ? String(item.product_id) : "";
  const conversationId = "conversation_id" in item && item.conversation_id ? String(item.conversation_id) : "";
  if (conversationId || combined.includes("chat") || combined.includes("pesan baru") || combined.includes("percakapan")) {
    return conversationId ? `/chat?conversation=${conversationId}` : "/chat";
  }
  if (productId || combined.includes("produk") || combined.includes("verifikasi") || combined.includes("disetujui") || combined.includes("ditolak")) {
    return productId ? `/dashboard/penjual?tab=products&product=${productId}` : "/dashboard/penjual?tab=products";
  }
  if (combined.includes("order baru") || combined.includes("pesanan baru") || combined.includes("pesanan masuk") || combined.includes("perlu kamu cek") || combined.includes("pesanan dibatalkan") || combined.includes("dibatalkan oleh pembeli") || combined.includes("pesanan selesai") || combined.includes("order selesai")) {
    return orderId ? `/dashboard/penjual?tab=orders&order=${orderId}` : "/dashboard/penjual?tab=orders";
  }
  if (combined.includes("dikirim") || combined.includes("resi") || combined.includes("pengiriman")) {
    return orderId ? `/dashboard/pembeli?order=${orderId}` : "/dashboard/pembeli";
  }
  if (rawTargetUrl && rawTargetUrl !== "/notifikasi") {
    return rawTargetUrl;
  }
  return "/notifikasi";
}
function openNotificationTarget(targetUrl) {
  if (typeof window === "undefined") return;
  const nextUrl = new URL(targetUrl, window.location.origin);
  const currentUrl = new URL(window.location.href);
  const isSamePath = nextUrl.pathname === currentUrl.pathname;
  if (isSamePath && nextUrl.pathname === "/dashboard/penjual") {
    window.history.pushState({}, "", nextUrl.toString());
    window.dispatchEvent(
      new CustomEvent("revibe:seller-tab-change", {
        detail: {
          tab: nextUrl.searchParams.get("tab") ?? "overview",
          orderId: nextUrl.searchParams.get("order") ?? "",
          productId: nextUrl.searchParams.get("product") ?? ""
        }
      })
    );
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    return;
  }
  window.location.href = nextUrl.pathname + nextUrl.search + nextUrl.hash;
}
function ChatPopup({
  loading,
  items
}) {
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b border-border px-4 py-3", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Pesan" }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Percakapan terbaru kamu" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto p-2", children: loading ? /* @__PURE__ */ jsx("div", { className: "px-4 py-8 text-center text-sm text-muted-foreground", children: "Memuat pesan..." }) : items.length === 0 ? /* @__PURE__ */ jsx(EmptyPopupText, { text: "Belum ada pesan", icon: "chat" }) : items.map((item) => /* @__PURE__ */ jsxs(
      "a",
      {
        href: `/chat?conversation=${item.id}`,
        className: "block rounded-lg px-3 py-2 text-sm transition hover:bg-accent",
        children: [
          /* @__PURE__ */ jsx("div", { className: "line-clamp-1 font-medium", children: "Percakapan" }),
          /* @__PURE__ */ jsx("div", { className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground", children: item.lastMessage }),
          item.createdAt ? /* @__PURE__ */ jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: new Date(item.createdAt).toLocaleString("id-ID") }) : null
        ]
      },
      item.id
    )) }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-border p-2", children: /* @__PURE__ */ jsx(
      "a",
      {
        href: "/chat",
        className: "block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent",
        children: "Buka Semua Pesan"
      }
    ) })
  ] });
}
function EmptyPopupText({
  text,
  icon
}) {
  const Icon = icon === "cart" ? ShoppingCart : icon === "chat" ? MessageCircle : Bell;
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-8 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm text-muted-foreground", children: text })
  ] });
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
export {
  Button as B,
  Footer as F,
  Navbar as N,
  cn as c,
  supabase as s,
  useAuth as u
};
