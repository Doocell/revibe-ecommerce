import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AdminSeller = {
    seller_id: string;
    email: string;
    full_name: string;
    shop_name: string;
    whatsapp: string;
    city: string;
    shop_location: string;
    is_active: boolean;
    total_products: number;
    active_products: number;
    pending_products: number;
    rejected_products: number;
    inactive_products: number;
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    gross_revenue: number;
    created_at: string;
};

export type AdminSellerFilter = {
    search?: string;
    status?: string;
    limit?: number;
};

export async function getAdminSellers(
    filters: AdminSellerFilter = {},
): Promise<AdminSeller[]> {
    const { data, error } = await db.rpc("get_admin_sellers", {
        p_search: emptyToNull(filters.search),
        p_status: emptyToNull(filters.status),
        p_limit: filters.limit ?? 300,
    });

    if (error) {
        throw new Error(
            error.message.includes("get_admin_sellers")
                ? "RPC get_admin_sellers belum tersedia. Jalankan migration SQL fitur admin terlebih dahulu."
                : error.message,
        );
    }

    return (data ?? []).map((row: any) => ({
        seller_id: String(row.seller_id ?? ""),
        email: String(row.email ?? ""),
        full_name: String(row.full_name ?? ""),
        shop_name: String(row.shop_name ?? ""),
        whatsapp: String(row.whatsapp ?? ""),
        city: String(row.city ?? ""),
        shop_location: String(row.shop_location ?? ""),
        is_active:
            row.is_active === null || row.is_active === undefined
                ? true
                : Boolean(row.is_active),
        total_products: Number(row.total_products ?? 0),
        active_products: Number(row.active_products ?? 0),
        pending_products: Number(row.pending_products ?? 0),
        rejected_products: Number(row.rejected_products ?? 0),
        inactive_products: Number(row.inactive_products ?? 0),
        total_orders: Number(row.total_orders ?? 0),
        completed_orders: Number(row.completed_orders ?? 0),
        cancelled_orders: Number(row.cancelled_orders ?? 0),
        gross_revenue: Number(row.gross_revenue ?? 0),
        created_at: String(row.created_at ?? ""),
    }));
}

export async function setAdminSellerActiveStatus({
    sellerId,
    isActive,
}: {
    sellerId: string;
    isActive: boolean;
}) {
    const cleanSellerId = String(sellerId ?? "").trim();

    if (!cleanSellerId || cleanSellerId === "undefined") {
        throw new Error("ID seller tidak valid.");
    }

    const { data, error } = await db.rpc("set_admin_user_active_status", {
        p_user_id: cleanSellerId,
        p_is_active: isActive,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

function emptyToNull(value: unknown) {
    const clean = String(value ?? "").trim();
    return clean ? clean : null;
}

export function formatIDR(value: number | string | null | undefined) {
    const numberValue = Number(value ?? 0);

    if (!Number.isFinite(numberValue)) {
        return "Rp 0";
    }

    return "Rp " + new Intl.NumberFormat("id-ID").format(numberValue);
}

export function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("id-ID");
}