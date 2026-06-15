import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type SellerProfile = {
    id: string;
    full_name: string;
    whatsapp: string;
    avatar_url: string;
    address: string;
    city: string;
    bio: string;
    shop_name: string;
    shop_description: string;
    shop_location: string;
    shop_logo_url: string;
    updated_at: string | null;
};

export type SellerProfilePayload = {
    full_name: string;
    whatsapp: string;
    avatar_url: string;
    address: string;
    city: string;
    bio: string;
    shop_name: string;
    shop_description: string;
    shop_location: string;
    shop_logo_url: string;
};

export async function getMySellerProfile() {
    const { data, error } = await db.rpc("get_my_seller_profile");

    if (error) {
        throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
        throw new Error("Profil seller tidak ditemukan. Pastikan akun sudah login sebagai penjual.");
    }

    return normalizeSellerProfile(row);
}

export async function updateMySellerProfile(payload: SellerProfilePayload) {
    const { data, error } = await db.rpc("update_my_seller_profile", {
        p_full_name: cleanText(payload.full_name),
        p_whatsapp: cleanText(payload.whatsapp),
        p_avatar_url: cleanText(payload.avatar_url),
        p_address: cleanText(payload.address),
        p_city: cleanText(payload.city),
        p_bio: cleanText(payload.bio),
        p_shop_name: cleanText(payload.shop_name),
        p_shop_description: cleanText(payload.shop_description),
        p_shop_location: cleanText(payload.shop_location),
        p_shop_logo_url: cleanText(payload.shop_logo_url),
    });

    if (error) {
        throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
        throw new Error("Profil seller gagal diperbarui.");
    }

    return normalizeSellerProfile(row);
}

function normalizeSellerProfile(row: any): SellerProfile {
    return {
        id: String(row.id ?? ""),
        full_name: String(row.full_name ?? ""),
        whatsapp: String(row.whatsapp ?? ""),
        avatar_url: String(row.avatar_url ?? ""),
        address: String(row.address ?? ""),
        city: String(row.city ?? ""),
        bio: String(row.bio ?? ""),
        shop_name: String(row.shop_name ?? ""),
        shop_description: String(row.shop_description ?? ""),
        shop_location: String(row.shop_location ?? ""),
        shop_logo_url: String(row.shop_logo_url ?? ""),
        updated_at: row.updated_at ?? null,
    };
}

function cleanText(value: string | null | undefined) {
    return String(value ?? "").trim();
}