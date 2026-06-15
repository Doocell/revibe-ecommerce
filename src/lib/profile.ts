import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type UserProfile = {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  bio: string | null;
  shop_name: string | null;
  shop_description: string | null;
  shop_location: string | null;
  shop_logo_url: string | null;
  updated_at: string | null;
};

export type PublicSellerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  shop_name: string | null;
  shop_description: string | null;
  shop_location: string | null;
  shop_logo_url: string | null;
};

export type UpdateProfilePayload = {
  full_name?: string | null;
  whatsapp?: string | null;
  avatar_url?: string | null;
  address?: string | null;
  city?: string | null;
  bio?: string | null;
  shop_name?: string | null;
  shop_description?: string | null;
  shop_location?: string | null;
  shop_logo_url?: string | null;
};

export async function getMyProfile(userId: string) {
  const cleanUserId = String(userId ?? "").trim();

  if (!cleanUserId || cleanUserId === "undefined") {
    throw new Error("ID user tidak valid.");
  }

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", cleanUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return data as UserProfile;
  }

  const { data: createdProfile, error: createError } = await db
    .from("profiles")
    .insert({
      id: cleanUserId,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdProfile as UserProfile;
}

export async function updateMyProfile(
  userId: string,
  payload: UpdateProfilePayload,
) {
  const cleanUserId = String(userId ?? "").trim();

  if (!cleanUserId || cleanUserId === "undefined") {
    throw new Error("ID user tidak valid.");
  }

  const cleanPayload = {
    id: cleanUserId,
    full_name: cleanText(payload.full_name),
    whatsapp: cleanText(payload.whatsapp),
    avatar_url: cleanText(payload.avatar_url),
    address: cleanText(payload.address),
    city: cleanText(payload.city),
    bio: cleanText(payload.bio),
    shop_name: cleanText(payload.shop_name),
    shop_description: cleanText(payload.shop_description),
    shop_location: cleanText(payload.shop_location),
    shop_logo_url: cleanText(payload.shop_logo_url),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("profiles")
    .upsert(cleanPayload, {
      onConflict: "id",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfile;
}

export async function getSellerIdByProductId(productId: string) {
  const cleanProductId = String(productId ?? "").trim();

  if (!cleanProductId || cleanProductId === "undefined") {
    return "";
  }

  const { data, error } = await db
    .from("products")
    .select("seller_id")
    .eq("id", cleanProductId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return String(data?.seller_id ?? "");
}

export async function getPublicSellerProfile(sellerId: string) {
  const cleanSellerId = String(sellerId ?? "").trim();

  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }

  const { data, error } = await db.rpc("get_public_seller_profile", {
    p_seller_id: cleanSellerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return {
      id: cleanSellerId,
      full_name: "Seller ReVibe",
      avatar_url: null,
      city: null,
      bio: null,
      shop_name: "Toko ReVibe",
      shop_description: null,
      shop_location: "Indonesia",
      shop_logo_url: null,
    } as PublicSellerProfile;
  }

  return row as PublicSellerProfile;
}

export async function getPublicSellerProducts(sellerId: string) {
  const cleanSellerId = String(sellerId ?? "").trim();

  if (!cleanSellerId || cleanSellerId === "undefined") {
    return [];
  }

  const { data, error } = await db
    .from("products")
    .select(
      `
      *,
      categories(id, name, slug)
    `,
    )
    .eq("seller_id", cleanSellerId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function cleanText(value: string | null | undefined) {
  const cleanValue = String(value ?? "").trim();

  return cleanValue.length > 0 ? cleanValue : null;
}