import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type NotificationType =
    | "order"
    | "payment"
    | "shipping"
    | "cancel"
    | "product"
    | "review"
    | "chat"
    | "system";

export type SystemNotification = {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    entity_type: string | null;
    entity_id: string | null;
    is_read: boolean;
    created_at: string;
};

export type NotificationFilter = {
    search?: string;
    type?: string;
    limit?: number;
    isAdmin?: boolean;
};

export async function getSystemNotifications(
    filters: NotificationFilter = {},
): Promise<SystemNotification[]> {
    if (filters.isAdmin) {
        const { data, error } = await db.rpc("get_admin_system_notifications", {
            p_search: emptyToNull(filters.search),
            p_type: emptyToNull(filters.type),
            p_limit: filters.limit ?? 200,
        });

        if (error) {
            throw new Error(
                error.message.includes("get_admin_system_notifications")
                    ? "RPC get_admin_system_notifications belum tersedia. Jalankan SQL notifikasi sistem terlebih dahulu."
                    : error.message,
            );
        }

        return (data ?? []).map(normalizeNotification);
    }

    const userResult = await supabase.auth.getUser();
    const userId = userResult.data.user?.id;

    if (!userId) {
        return [];
    }

    const { data, error } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 200);

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
        rows = rows.filter((item) =>
            `${item.title} ${item.message} ${item.entity_id ?? ""}`
                .toLowerCase()
                .includes(search),
        );
    }

    return rows;
}

export async function markSystemNotificationRead({
    notificationId,
    isAdmin,
}: {
    notificationId: string;
    isAdmin?: boolean;
}) {
    if (!notificationId) {
        throw new Error("ID notifikasi tidak valid.");
    }

    if (isAdmin) {
        const { error } = await db.rpc("mark_admin_system_notification_read", {
            p_notification_id: notificationId,
        });

        if (error) {
            throw new Error(error.message);
        }

        return;
    }

    const { error } = await db
        .from("notifications")
        .update({
            is_read: true,
        })
        .eq("id", notificationId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function markAllSystemNotificationsRead({
    isAdmin,
}: {
    isAdmin?: boolean;
}) {
    if (isAdmin) {
        const { error } = await db.rpc("mark_all_admin_system_notifications_read");

        if (error) {
            throw new Error(error.message);
        }

        return;
    }

    const userResult = await supabase.auth.getUser();
    const userId = userResult.data.user?.id;

    if (!userId) {
        return;
    }

    const { error } = await db
        .from("notifications")
        .update({
            is_read: true,
        })
        .eq("user_id", userId);

    if (error) {
        throw new Error(error.message);
    }
}

function normalizeNotification(row: any): SystemNotification {
    return {
        id: String(row.id ?? ""),
        type: normalizeType(row.type),
        title: String(row.title ?? "Notifikasi"),
        message: String(row.message ?? ""),
        entity_type: row.entity_type ? String(row.entity_type) : null,
        entity_id: row.entity_id ? String(row.entity_id) : null,
        is_read: Boolean(row.is_read),
        created_at: String(row.created_at ?? new Date().toISOString()),
    };
}

function normalizeType(value: unknown): NotificationType {
    const clean = String(value ?? "system");

    if (
        [
            "order",
            "payment",
            "shipping",
            "cancel",
            "product",
            "review",
            "chat",
            "system",
        ].includes(clean)
    ) {
        return clean as NotificationType;
    }

    return "system";
}

function emptyToNull(value: unknown) {
    const clean = String(value ?? "").trim();
    return clean && clean !== "all" ? clean : null;
}

export function notificationTypeLabel(type: string) {
    const labels: Record<string, string> = {
        order: "Order",
        payment: "Pembayaran",
        shipping: "Pengiriman",
        cancel: "Pembatalan",
        product: "Produk",
        review: "Ulasan",
        chat: "Chat",
        system: "Sistem",
    };

    return labels[type] ?? "Sistem";
}

export function formatNotificationDate(value: string | null | undefined) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID");
}