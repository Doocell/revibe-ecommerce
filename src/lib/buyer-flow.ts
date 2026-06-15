import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ProductRow = Tables<"products">;
export type CategoryRow = Tables<"categories">;
export type ProfileRow = Tables<"profiles">;

export type ProductDetail = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  seller: Pick<ProfileRow, "id" | "full_name" | "shop_name" | "whatsapp" | "shop_logo_url" | "shop_location"> | null;
};

type ProductWithCategory = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
};

export async function getApprovedProductDetail(productId: string) {
  const { data: product, error } = await supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("id", productId)
    .eq("status", "approved")
    .single();

  if (error) {
    throw error;
  }

  const productRow = product as ProductWithCategory;

  const { data: seller, error: sellerError } = await supabase
    .from("profiles")
    .select("id, full_name, shop_name, whatsapp, shop_logo_url, shop_location")
    .eq("id", productRow.seller_id)
    .maybeSingle();

  if (sellerError) {
    throw sellerError;
  }

  return {
    ...productRow,
    seller: seller ?? null,
  } as ProductDetail;
}

export async function addProductToCart({
  product,
  quantity,
}: {
  product: ProductDetail;
  quantity: number;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Silakan login sebagai pembeli terlebih dahulu.");
  }

  if (product.seller_id === user.id) {
    throw new Error("Penjual tidak bisa membeli produknya sendiri.");
  }

  if (product.status !== "approved") {
    throw new Error("Produk belum disetujui admin.");
  }

  if (product.stock < 1) {
    throw new Error("Stok produk habis.");
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Jumlah produk minimal 1.");
  }

  if (quantity > product.stock) {
    throw new Error("Jumlah produk melebihi stok tersedia.");
  }

  const { data: existingCart, error: existingError } = await supabase
    .from("carts")
    .select("id, quantity")
    .eq("buyer_id", user.id)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingCart) {
    const nextQuantity = existingCart.quantity + quantity;

    if (nextQuantity > product.stock) {
      throw new Error("Jumlah produk di keranjang melebihi stok tersedia.");
    }

    const { data, error } = await supabase
      .from("carts")
      .update({
        quantity: nextQuantity,
      })
      .eq("id", existingCart.id)
      .eq("buyer_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("carts")
    .insert({
      buyer_id: user.id,
      product_id: product.id,
      quantity,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) {
    return "Rp 0";
  }

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

export function conditionLabel(condition: ProductRow["condition"]) {
  const labels: Record<ProductRow["condition"], string> = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup",
  };

  return labels[condition] ?? condition;
}