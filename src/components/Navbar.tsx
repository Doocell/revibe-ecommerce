import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useAuth, signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  resolveNotificationTargetUrl,
  type NotificationRow,
} from "@/lib/notifications";
import {
  Bell,
  Heart,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

const db = supabase as any;

const links = [
  { to: "/", label: "Beranda" },
  { to: "/kategori", label: "Kategori" },
  { to: "/produk", label: "Produk Preloved" },
  { to: "/tentang", label: "Tentang Kami" },
] as const;

type ChatPreviewItem = {
  id: string;
  lastMessage: string;
  createdAt: string | null;
};

type CartPreviewItem = {
  id: string;
  productId: string;
  quantity: number;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
};

export function Navbar() {
  const { user, roles } = useAuth();

  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const [recentNotifications, setRecentNotifications] = useState<
    NotificationRow[]
  >([]);
  const [chatPreview, setChatPreview] = useState<ChatPreviewItem[]>([]);
  const [cartPreview, setCartPreview] = useState<CartPreviewItem[]>([]);

  const [loadingNotifPreview, setLoadingNotifPreview] = useState(false);
  const [loadingChatPreview, setLoadingChatPreview] = useState(false);
  const [loadingCartPreview, setLoadingCartPreview] = useState(false);

  const safeRoles = roles ?? [];

  const isBuyer = safeRoles.includes("buyer");
  const isSeller = safeRoles.includes("seller");
  const isAdmin = safeRoles.includes("admin");

  const canUseChat = isBuyer || isSeller;

  const dashHref = isAdmin
    ? "/dashboard/admin"
    : isSeller
      ? "/dashboard/penjual"
      : isBuyer
        ? "/dashboard/pembeli"
        : null;

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
        getMyNotifications(user.id),
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
      const { data: conversations, error: conversationError } = await db
        .from("chat_conversations")
        .select("id, buyer_id, seller_id, created_at")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (conversationError) {
        throw new Error(conversationError.message);
      }

      const conversationRows = conversations ?? [];
      const conversationIds = conversationRows.map(
        (conversation: { id: string }) => conversation.id,
      );

      if (conversationIds.length === 0) {
        setChatPreview([]);
        return;
      }

      const { data: messages, error: messageError } = await db
        .from("chat_messages")
        .select("id, conversation_id, sender_id, message, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messageError) {
        throw new Error(messageError.message);
      }

      const messageRows = messages ?? [];
      const latestMessageMap = new Map<string, any>();

      for (const message of messageRows) {
        if (!latestMessageMap.has(message.conversation_id)) {
          latestMessageMap.set(message.conversation_id, message);
        }
      }

      const preview = conversationRows.map((conversation: { id: string }) => {
        const latestMessage = latestMessageMap.get(conversation.id);

        return {
          id: conversation.id,
          lastMessage: latestMessage?.message ?? "Belum ada pesan",
          createdAt: latestMessage?.created_at ?? null,
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
      const { data, error } = await db
        .from("cart_items")
        .select(
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
        `,
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        throw new Error(error.message);
      }

      const rows = data ?? [];

      const preview: CartPreviewItem[] = rows.map((item: any) => {
        const product = Array.isArray(item.products)
          ? item.products[0]
          : item.products;

        return {
          id: item.id,
          productId: item.product_id,
          quantity: Number(item.quantity ?? 0),
          productTitle: product?.title ?? "Produk",
          productImage: product?.images?.[0] ?? null,
          productPrice: Number(product?.price ?? 0),
        };
      });

      const total = rows.reduce((sum: number, item: any) => {
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

    const { data, error } = await db
      .from("cart_items")
      .select("quantity")
      .eq("buyer_id", user.id);

    if (error) {
      console.error("[Navbar Cart Count Error]", error);
      setCartCount(0);
      return;
    }

    const total = (data ?? []).reduce((sum: number, item: any) => {
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

    const channel = db
      .channel(`navbar_cart_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          loadCartCount();
          loadCartPreview();
        },
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id, isBuyer]);

  useEffect(() => {
    loadNotificationCount();

    const interval = window.setInterval(() => {
      loadNotificationCount();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-accent-foreground"
              activeProps={{
                className:
                  "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-accent",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <NavPopup
                onOpen={loadNotificationPreview}
                popup={
                  <NotificationPopup
                    loading={loadingNotifPreview}
                    items={recentNotifications}
                    unreadCount={notificationCount}
                  />
                }
              >
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  aria-label="Notifikasi"
                  title="Notifikasi"
                >
                  <a href="/notifikasi" className="relative">
                    <Bell className="h-4 w-4" />

                    {notificationCount > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {notificationCount}
                      </span>
                    ) : null}
                  </a>
                </Button>
              </NavPopup>

              {isBuyer ? (
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  title="Wishlist"
                  aria-label="Wishlist"
                >
                  <a href="/wishlist">
                    <Heart className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}

              {canUseChat ? (
                <NavPopup
                  onOpen={loadChatPreview}
                  popup={
                    <ChatPopup
                      loading={loadingChatPreview}
                      items={chatPreview}
                    />
                  }
                >
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    aria-label="Pesan"
                    title="Pesan"
                  >
                    <a href="/chat">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                </NavPopup>
              ) : null}

              {isBuyer ? (
                <NavPopup
                  onOpen={loadCartPreview}
                  popup={
                    <CartPopup
                      loading={loadingCartPreview}
                      items={cartPreview}
                      totalCount={cartCount}
                    />
                  }
                >
                  <Button asChild variant="outline" size="sm">
                    <a href="/keranjang">
                      <ShoppingCart className="mr-1 h-4 w-4" />
                      Keranjang
                      {cartCount > 0 ? (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {cartCount}
                        </span>
                      ) : null}
                    </a>
                  </Button>
                </NavPopup>
              ) : null}

              {isBuyer ? (
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  title="Alamat Pengiriman"
                  aria-label="Alamat Pengiriman"
                >
                  <a href="/alamat">
                    <MapPin className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}

              {dashHref ? (
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  title="Dashboard"
                  aria-label="Dashboard"
                >
                  <a href={dashHref}>
                    <UserRound className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}

              <Button
                size="icon"
                variant="ghost"
                title="Keluar"
                aria-label="Keluar"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login/pembeli">Masuk</Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="gradient-brand text-white shadow-brand"
              >
                <Link to="/register/pembeli">Daftar</Link>
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((current) => !current)}
          className="md:hidden"
          aria-label="Menu"
          type="button"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <a
                href="/notifikasi"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifikasi
                </span>

                {notificationCount > 0 ? (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                    {notificationCount}
                  </span>
                ) : null}
              </a>
            ) : null}

            {user && isBuyer ? (
              <a
                href="/wishlist"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </a>
            ) : null}

            {user && canUseChat ? (
              <a
                href="/chat"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <MessageCircle className="h-4 w-4" />
                Pesan
              </a>
            ) : null}

            {user && isBuyer ? (
              <a
                href="/keranjang"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Keranjang
                </span>

                {cartCount > 0 ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {cartCount}
                  </span>
                ) : null}
              </a>
            ) : null}

            {user && isBuyer ? (
              <a
                href="/alamat"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <MapPin className="h-4 w-4" />
                Alamat Pengiriman
              </a>
            ) : null}

            {user && dashHref ? (
              <a
                href={dashHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <UserRound className="h-4 w-4" />
                Dashboard
              </a>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            ) : null}

            {!user ? (
              <div className="mt-2 flex gap-2 border-t border-border pt-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/login/pembeli">Masuk</Link>
                </Button>

                <Button asChild className="flex-1 gradient-brand text-white">
                  <Link to="/register/pembeli">Daftar</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavPopup({
  children,
  popup,
  onOpen,
}: {
  children: ReactNode;
  popup: ReactNode;
  onOpen?: () => void;
}) {
  return (
    <div className="group relative inline-flex" onMouseEnter={onOpen}>
      {children}

      <div className="invisible absolute right-0 top-full z-50 mt-3 w-80 translate-y-2 rounded-xl border border-border bg-background p-0 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {popup}
      </div>
    </div>
  );
}

function CartPopup({
  loading,
  items,
  totalCount,
}: {
  loading: boolean;
  items: CartPreviewItem[];
  totalCount: number;
}) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.productPrice * item.quantity;
  }, 0);

  return (
    <div className="overflow-hidden rounded-xl bg-background">
      <div className="border-b border-border px-4 py-3">
        <div className="font-semibold">Keranjang</div>
        <div className="text-xs text-muted-foreground">
          {totalCount > 0
            ? `${totalCount} produk di keranjang`
            : "Keranjang masih kosong"}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Memuat keranjang...
          </div>
        ) : items.length === 0 ? (
          <EmptyPopupText text="Belum ada produk" icon="cart" />
        ) : (
          items.map((item) => (
            <a
              key={item.id}
              href={`/detail-produk?id=${item.productId}`}
              className="flex gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-medium">
                  {item.productTitle}
                </div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  {item.quantity} x {formatIDR(item.productPrice)}
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      {items.length > 0 ? (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatIDR(subtotal)}</span>
          </div>

          <a
            href="/keranjang"
            className="block rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Lihat Keranjang
          </a>
        </div>
      ) : (
        <div className="border-t border-border p-2">
          <a
            href="/produk"
            className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent"
          >
            Mulai Belanja
          </a>
        </div>
      )}
    </div>
  );
}

function NotificationPopup({
  loading,
  items,
  unreadCount,
}: {
  loading: boolean;
  items: NotificationRow[];
  unreadCount: number;
}) {
  async function handleClickNotification(item: NotificationRow) {
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

  return (
    <div className="overflow-hidden rounded-xl bg-background">
      <div className="border-b border-border px-4 py-3">
        <div className="font-semibold">Notifikasi</div>

        <div className="text-xs text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} belum dibaca`
            : "Tidak ada notifikasi baru"}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Memuat notifikasi...
          </div>
        ) : items.length === 0 ? (
          <EmptyPopupText text="Belum ada notifikasi" icon="notification" />
        ) : (
          items.map((item) => {
            const targetUrl = resolveNavbarNotificationTarget(item);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClickNotification(item)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent ${item.is_read ? "" : "bg-primary/5"
                  }`}
                title={`Buka: ${targetUrl}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-1 font-medium">
                      {item.title}
                    </div>

                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.message}
                    </div>

                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("id-ID")}
                    </div>
                  </div>

                  {!item.is_read ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-2">
        <a
          href="/notifikasi"
          className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent"
        >
          Lihat Semua Notifikasi
        </a>
      </div>
    </div>
  );
}

function resolveNavbarNotificationTarget(item: NotificationRow) {
  const rawTargetUrl = String(item.target_url ?? "").trim();

  const title = String(item.title ?? "").toLowerCase();
  const message = String(item.message ?? "").toLowerCase();
  const type = String(item.type ?? "").toLowerCase();
  const combined = `${title} ${message} ${type}`;

  const orderId =
    "order_id" in item && item.order_id ? String(item.order_id) : "";

  const productId =
    "product_id" in item && item.product_id ? String(item.product_id) : "";

  const conversationId =
    "conversation_id" in item && item.conversation_id
      ? String(item.conversation_id)
      : "";

  if (
    conversationId ||
    combined.includes("chat") ||
    combined.includes("pesan baru") ||
    combined.includes("percakapan")
  ) {
    return conversationId
      ? `/chat?conversation=${conversationId}`
      : "/chat";
  }

  if (
    productId ||
    combined.includes("produk") ||
    combined.includes("verifikasi") ||
    combined.includes("disetujui") ||
    combined.includes("ditolak")
  ) {
    return productId
      ? `/dashboard/penjual?tab=products&product=${productId}`
      : "/dashboard/penjual?tab=products";
  }

  if (
    combined.includes("order baru") ||
    combined.includes("pesanan baru") ||
    combined.includes("pesanan masuk") ||
    combined.includes("perlu kamu cek") ||
    combined.includes("pesanan dibatalkan") ||
    combined.includes("dibatalkan oleh pembeli") ||
    combined.includes("pesanan selesai") ||
    combined.includes("order selesai")
  ) {
    return orderId
      ? `/dashboard/penjual?tab=orders&order=${orderId}`
      : "/dashboard/penjual?tab=orders";
  }

  if (
    combined.includes("dikirim") ||
    combined.includes("resi") ||
    combined.includes("pengiriman")
  ) {
    return orderId
      ? `/dashboard/pembeli?order=${orderId}`
      : "/dashboard/pembeli";
  }

  if (rawTargetUrl && rawTargetUrl !== "/notifikasi") {
    return rawTargetUrl;
  }

  return "/notifikasi";
}

function openNotificationTarget(targetUrl: string) {
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
          productId: nextUrl.searchParams.get("product") ?? "",
        },
      }),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  window.location.href = nextUrl.pathname + nextUrl.search + nextUrl.hash;
}

function navigateToNotificationTarget(targetUrl: string) {
  if (typeof window === "undefined") return;

  const nextUrl = new URL(targetUrl, window.location.origin);
  const currentUrl = new URL(window.location.href);

  const samePage = nextUrl.pathname === currentUrl.pathname;

  if (samePage) {
    window.history.pushState({}, "", nextUrl.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  window.location.assign(nextUrl.pathname + nextUrl.search + nextUrl.hash);
}
function ChatPopup({
  loading,
  items,
}: {
  loading: boolean;
  items: ChatPreviewItem[];
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-background">
      <div className="border-b border-border px-4 py-3">
        <div className="font-semibold">Pesan</div>

        <div className="text-xs text-muted-foreground">
          Percakapan terbaru kamu
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Memuat pesan...
          </div>
        ) : items.length === 0 ? (
          <EmptyPopupText text="Belum ada pesan" icon="chat" />
        ) : (
          items.map((item) => (
            <a
              key={item.id}
              href={`/chat?conversation=${item.id}`}
              className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              <div className="line-clamp-1 font-medium">Percakapan</div>

              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {item.lastMessage}
              </div>

              {item.createdAt ? (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString("id-ID")}
                </div>
              ) : null}
            </a>
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <a
          href="/chat"
          className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent"
        >
          Buka Semua Pesan
        </a>
      </div>
    </div>
  );
}

function EmptyPopupText({
  text,
  icon,
}: {
  text: string;
  icon: "cart" | "chat" | "notification";
}) {
  const Icon =
    icon === "cart" ? ShoppingCart : icon === "chat" ? MessageCircle : Bell;

  return (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>

      <div className="mt-3 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
