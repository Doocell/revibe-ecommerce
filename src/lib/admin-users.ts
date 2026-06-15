import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AdminUserRow = {
    id: string;
    email: string;
    full_name: string;
    whatsapp: string;
    avatar_url: string;
    city: string;
    is_active: boolean;
    roles: string[];
    total_orders: number;
    total_products: number;
    created_at: string;
    last_sign_in_at: string | null;
};

export type AdminUserFilter = {
    role?: string;
    search?: string;
    status?: string;
    limit?: number;
};

export async function getAdminUsers(filters: AdminUserFilter = {}) {
    const { data, error } = await db.rpc("get_admin_users", {
        p_role: filters.role || null,
        p_search: filters.search || null,
        p_status: filters.status || null,
        p_limit: filters.limit ?? 200,
    });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map(normalizeAdminUser) as AdminUserRow[];
}

export async function setAdminUserActiveStatus({
    userId,
    isActive,
}: {
    userId: string;
    isActive: boolean;
}) {
    const cleanUserId = String(userId ?? "").trim();

    if (!cleanUserId || cleanUserId === "undefined") {
        throw new Error("ID user tidak valid.");
    }

    const { data, error } = await db.rpc("set_admin_user_active_status", {
        p_user_id: cleanUserId,
        p_is_active: isActive,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

function normalizeAdminUser(row: any): AdminUserRow {
    return {
        id: String(row.id ?? ""),
        email: String(row.email ?? ""),
        full_name: String(row.full_name ?? ""),
        whatsapp: String(row.whatsapp ?? ""),
        avatar_url: String(row.avatar_url ?? ""),
        city: String(row.city ?? ""),
        is_active: Boolean(row.is_active),
        roles: Array.isArray(row.roles) ? row.roles.map(String) : [],
        total_orders: Number(row.total_orders ?? 0),
        total_products: Number(row.total_products ?? 0),
        created_at: String(row.created_at ?? ""),
        last_sign_in_at: row.last_sign_in_at ?? null,
    };
}

export function roleLabel(role: string) {
    const labels: Record<string, string> = {
        admin: "Admin",
        seller: "Seller",
        buyer: "Buyer",
    };

    return labels[role] ?? role;
}

export function formatDateTime(value: string | null) {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID");
}