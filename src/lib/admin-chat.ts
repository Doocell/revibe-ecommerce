import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AdminChatThread = {
    conversation_id: string;
    buyer_id: string;
    seller_id: string;
    buyer_name: string;
    seller_name: string;
    product_id: string | null;
    product_title: string;
    product_image: string | null;
    last_message: string;
    last_sender_id: string | null;
    last_message_at: string | null;
    message_count: number;
    unread_count: number;
};

export type AdminChatMessage = {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    message: string;
    is_read: boolean;
    created_at: string;
};

export type AdminChatFilter = {
    search?: string;
    limit?: number;
};

export async function getAdminChatThreads(
    filters: AdminChatFilter = {},
): Promise<AdminChatThread[]> {
    const { data, error } = await db.rpc("get_admin_chat_threads", {
        p_search: emptyToNull(filters.search),
        p_limit: filters.limit ?? 300,
    });

    if (error) {
        throw new Error(
            error.message.includes("get_admin_chat_threads")
                ? "RPC get_admin_chat_threads belum tersedia. Jalankan migration SQL fitur admin terlebih dahulu."
                : error.message,
        );
    }

    return (data ?? []).map((row: any) => ({
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
        unread_count: Number(row.unread_count ?? 0),
    }));
}

export async function getAdminChatMessages(
    conversationId: string,
): Promise<AdminChatMessage[]> {
    const cleanConversationId = String(conversationId ?? "").trim();

    if (!cleanConversationId || cleanConversationId === "undefined") {
        throw new Error("ID percakapan tidak valid.");
    }

    const { data, error } = await db.rpc("get_admin_chat_messages", {
        p_conversation_id: cleanConversationId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map((row: any) => ({
        id: String(row.id ?? ""),
        conversation_id: String(row.conversation_id ?? ""),
        sender_id: String(row.sender_id ?? ""),
        sender_name: String(row.sender_name ?? "User"),
        message: String(row.message ?? ""),
        is_read: Boolean(row.is_read),
        created_at: String(row.created_at ?? ""),
    }));
}

function emptyToNull(value: unknown) {
    const clean = String(value ?? "").trim();
    return clean ? clean : null;
}

export function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("id-ID");
}