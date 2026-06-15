import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type ProductStatus = Database["public"]["Enums"]["product_status"];
export type ProductRow = Tables<"products">;
export type CategoryRow = Tables<"categories">;
export type ProfileRow = Tables<"profiles">;

export type AdminProduct = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  seller: Pick<ProfileRow, "id" | "full_name" | "shop_name" | "whatsapp"> | null;
};

type ProductWithCategory = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
};

export async function getAdminProducts(status?: ProductStatus | "all") {
  let query = supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: products, error } = await query;

  if (error) throw error;

  const rows = (products ?? []) as ProductWithCategory[];

  const sellerIds = Array.from(new Set(rows.map((product) => product.seller_id)));

  if (sellerIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, shop_name, whatsapp")
    .in("id", sellerIds);

  if (profileError) throw profileError;

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return rows.map((product) => ({
    ...product,
    seller: profileMap.get(product.seller_id) ?? null,
  })) as AdminProduct[];
}

export async function updateProductStatus(
  productId: string,
  status: ProductStatus,
) {
  const { data, error } = await supabase
    .from("products")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select("*, categories(id, name, slug)")
    .single();

  if (error) throw error;

  return data as ProductWithCategory;
}