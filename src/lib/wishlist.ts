import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type WishlistProduct = {
  id: string;
  title: string;
  price: number | string;
  original_price: number | string | null;
  images: string[] | null;
  location: string | null;
  condition: string | null;
  stock: number;
  status: string;
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type WishlistItem = {
  id: string;
  buyer_id: string;
  product_id: string;
  created_at: string;
  products: WishlistProduct | null;
};

export async function isProductWishlisted({
  buyerId,
  productId,
}: {
  buyerId: string;
  productId: string;
}) {
  const { data, error } = await db
    .from("wishlists")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function addToWishlist({
  buyerId,
  productId,
}: {
  buyerId: string;
  productId: string;
}) {
  const { data, error } = await db
    .from("wishlists")
    .insert({
      buyer_id: buyerId,
      product_id: productId,
    })
    .select()
    .single();

  if (error) {
    if (String(error.message).toLowerCase().includes("duplicate")) {
      return null;
    }

    throw new Error(error.message);
  }

  return data;
}

export async function removeFromWishlist({
  buyerId,
  productId,
}: {
  buyerId: string;
  productId: string;
}) {
  const { error } = await db
    .from("wishlists")
    .delete()
    .eq("buyer_id", buyerId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleWishlist({
  buyerId,
  productId,
}: {
  buyerId: string;
  productId: string;
}) {
  const existing = await isProductWishlisted({
    buyerId,
    productId,
  });

  if (existing) {
    await removeFromWishlist({
      buyerId,
      productId,
    });

    return false;
  }

  await addToWishlist({
    buyerId,
    productId,
  });

  return true;
}

export async function getBuyerWishlist(buyerId: string) {
  const { data, error } = await db
    .from("wishlists")
    .select(
      `
      *,
      products(
        id,
        title,
        price,
        original_price,
        images,
        location,
        condition,
        stock,
        status,
        categories(id, name, slug)
      )
    `,
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WishlistItem[];
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

export function conditionLabel(condition: string | null) {
  const labels: Record<string, string> = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup",
  };

  if (!condition) return "-";

  return labels[condition] ?? condition;
}