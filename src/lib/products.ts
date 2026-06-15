import { supabase } from "@/integrations/supabase/client";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";

export type ProductRow = Tables<"products">;
export type CategoryRow = Tables<"categories">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export type ProductWithCategory = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
};

export async function getApprovedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as ProductWithCategory[];
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, created_at")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export function getCategorySlug(product: ProductWithCategory) {
  return product.categories?.slug ?? "lainnya";
}