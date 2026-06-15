import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CartRow = Tables<"carts">;
export type ProductRow = Tables<"products">;
export type CategoryRow = Tables<"categories">;

export type CartProduct = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
};

export type CartItem = CartRow & {
  products: CartProduct | null;
};

export async function getBuyerCart(buyerId: string) {
  const { data, error } = await supabase
    .from("carts")
    .select(
      `
      *,
      products(
        *,
        categories(id, name, slug)
      )
    `,
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as CartItem[];
}

export async function updateCartQuantity({
  cartId,
  buyerId,
  quantity,
}: {
  cartId: string;
  buyerId: string;
  quantity: number;
}) {
  if (quantity < 1) {
    return deleteCartItem({ cartId, buyerId });
  }

  const { data, error } = await supabase
    .from("carts")
    .update({ quantity })
    .eq("id", cartId)
    .eq("buyer_id", buyerId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteCartItem({
  cartId,
  buyerId,
}: {
  cartId: string;
  buyerId: string;
}) {
  const { error } = await supabase
    .from("carts")
    .delete()
    .eq("id", cartId)
    .eq("buyer_id", buyerId);

  if (error) throw error;

  return true;
}

export async function clearBuyerCart(buyerId: string) {
  const { error } = await supabase.from("carts").delete().eq("buyer_id", buyerId);

  if (error) throw error;

  return true;
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => {
    if (!item.products) return total;

    return total + Number(item.products.price) * item.quantity;
  }, 0);
}