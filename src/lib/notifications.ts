import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  order_id: string | null;
  product_id: string | null;
  conversation_id: string | null;
  target_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string | null;
};

export async function getMyNotifications(limit = 30): Promise<NotificationRow[]> {
  const userId = await getCurrentUserId();

  if (!userId) return [];

  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeNotification);
}

export async function getUnreadNotificationCount() {
  const userId = await getCurrentUserId();

  if (!userId) return 0;

  const { count, error } = await db
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const userId = await getCurrentUserId();

  if (!userId || !notificationId) return;

  const { error } = await db
    .from("notifications")
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsAsRead() {
  const userId = await getCurrentUserId();

  if (!userId) return;

  const { error } = await db
    .from("notifications")
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createNotification({
  userId,
  title,
  message,
  type = "system",
  orderId,
  productId,
  conversationId,
  targetUrl,
  metadata = {},
}: {
  userId: string;
  title: string;
  message?: string | null;
  type?: string;
  orderId?: string | null;
  productId?: string | null;
  conversationId?: string | null;
  targetUrl?: string | null;
  metadata?: Record<string, any>;
}) {
  if (!userId) return null;

  const { data, error } = await db.rpc("create_notification", {
    p_user_id: userId,
    p_title: title,
    p_message: message ?? null,
    p_type: type,
    p_order_id: orderId ?? null,
    p_product_id: productId ?? null,
    p_conversation_id: conversationId ?? null,
    p_target_url: targetUrl ?? null,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string | null;
}

export function resolveNotificationTargetUrl(item: NotificationRow) {
  const rawTargetUrl = String(item.target_url ?? "").trim();

  if (rawTargetUrl && rawTargetUrl !== "/notifikasi") {
    return rawTargetUrl;
  }

  const title = String(item.title ?? "").toLowerCase();
  const message = String(item.message ?? "").toLowerCase();
  const type = String(item.type ?? "").toLowerCase();
  const combined = `${title} ${message} ${type}`;

  const orderId = item.order_id ? String(item.order_id) : "";
  const productId = item.product_id ? String(item.product_id) : "";
  const conversationId = item.conversation_id
    ? String(item.conversation_id)
    : "";

  if (
    conversationId ||
    combined.includes("chat") ||
    combined.includes("percakapan")
  ) {
    return conversationId
      ? `/chat?conversation=${conversationId}`
      : "/chat";
  }

  if (
    combined.includes("order baru") ||
    combined.includes("pesanan baru") ||
    combined.includes("pesanan dibatalkan") ||
    combined.includes("dibatalkan oleh pembeli") ||
    combined.includes("pembeli sudah menyelesaikan") ||
    combined.includes("perlu kamu cek")
  ) {
    return orderId
      ? `/dashboard/penjual?tab=orders&order=${orderId}`
      : "/dashboard/penjual?tab=orders";
  }

  if (
    combined.includes("pesanan dikirim") ||
    combined.includes("resi") ||
    combined.includes("pengiriman") ||
    combined.includes("pesanan kamu") ||
    combined.includes("pesanan selesai")
  ) {
    return orderId
      ? `/dashboard/pembeli?order=${orderId}`
      : "/dashboard/pembeli";
  }

  if (
    combined.includes("produk disetujui") ||
    combined.includes("produk ditolak") ||
    combined.includes("verifikasi") ||
    combined.includes("approved") ||
    combined.includes("rejected")
  ) {
    return productId
      ? `/dashboard/penjual?tab=products&product=${productId}`
      : "/dashboard/penjual?tab=products";
  }

  if (
    combined.includes("ulasan") ||
    combined.includes("review") ||
    combined.includes("rating")
  ) {
    return productId ? `/detail-produk?id=${productId}` : "/dashboard/penjual";
  }

  if (productId) {
    return `/detail-produk?id=${productId}`;
  }

  if (orderId) {
    return `/dashboard/pembeli?order=${orderId}`;
  }

  return "/notifikasi";
}

export function openNotificationTarget(targetUrl: string) {
  if (typeof window === "undefined") return;

  const nextUrl = new URL(targetUrl, window.location.origin);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.pathname === currentUrl.pathname) {
    window.history.pushState({}, "", nextUrl.toString());

    if (nextUrl.pathname === "/dashboard/penjual") {
      window.dispatchEvent(
        new CustomEvent("revibe:seller-tab-change", {
          detail: {
            tab: nextUrl.searchParams.get("tab") ?? "overview",
            orderId: nextUrl.searchParams.get("order") ?? "",
            productId: nextUrl.searchParams.get("product") ?? "",
          },
        }),
      );
    }

    if (nextUrl.pathname === "/dashboard/pembeli") {
      window.dispatchEvent(
        new CustomEvent("revibe:buyer-order-focus", {
          detail: {
            orderId: nextUrl.searchParams.get("order") ?? "",
          },
        }),
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  window.location.href = nextUrl.pathname + nextUrl.search + nextUrl.hash;
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("[Get Current User Error]", error);
    return "";
  }

  return data.user?.id ?? "";
}

function normalizeNotification(row: any): NotificationRow {
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
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? null,
  };
}