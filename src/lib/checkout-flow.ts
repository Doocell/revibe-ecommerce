import { supabase } from "@/integrations/supabase/client";
import type {
  Tables,
  TablesInsert,
} from "@/integrations/supabase/types";

export type CartRow = Tables<"carts">;
export type ProductRow = Tables<"products">;
export type CategoryRow = Tables<"categories">;
export type OrderRow = Tables<"orders">;
export type OrderInsert = TablesInsert<"orders">;
export type OrderItemInsert = TablesInsert<"order_items">;

export type CheckoutProduct = ProductRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug"> | null;
};

export type CheckoutCartItem = CartRow & {
  products: CheckoutProduct | null;
};

export type CheckoutInput = {
  buyerId: string;
  shippingAddress: string;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: string;
  notes?: string | null;
};

export async function getCheckoutCart(buyerId: string) {
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

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CheckoutCartItem[];

  return rows.filter((item) => {
    return item.products && item.products.status === "approved";
  });
}

export function getCheckoutSubtotal(items: CheckoutCartItem[]) {
  return items.reduce((total, item) => {
    if (!item.products) return total;

    return total + Number(item.products.price) * item.quantity;
  }, 0);
}

export function getSellerCount(items: CheckoutCartItem[]) {
  const sellerIds = new Set(
    items
      .map((item) => item.products?.seller_id)
      .filter((sellerId): sellerId is string => Boolean(sellerId)),
  );

  return sellerIds.size;
}

export function getCheckoutTotal(
  items: CheckoutCartItem[],
  shippingCost: number,
) {
  const sellerCount = Math.max(getSellerCount(items), 1);

  return getCheckoutSubtotal(items) + shippingCost * sellerCount;
}

export async function createOrdersFromCart(input: CheckoutInput) {
  const items = await getCheckoutCart(input.buyerId);

  if (items.length === 0) {
    throw new Error("Keranjang masih kosong.");
  }

  for (const item of items) {
    if (!item.products) {
      throw new Error("Ada produk yang tidak valid di keranjang.");
    }

    if (item.products.stock < 1) {
      throw new Error(`Stok produk "${item.products.title}" habis.`);
    }

    if (item.quantity > item.products.stock) {
      throw new Error(`Stok produk "${item.products.title}" tidak mencukupi.`);
    }
  }

  const groupedBySeller = new Map<string, CheckoutCartItem[]>();

  for (const item of items) {
    const sellerId = item.products?.seller_id;

    if (!sellerId) continue;

    const sellerItems = groupedBySeller.get(sellerId) ?? [];
    sellerItems.push(item);
    groupedBySeller.set(sellerId, sellerItems);
  }

  if (groupedBySeller.size === 0) {
    throw new Error("Tidak ada seller valid pada keranjang.");
  }

  const createdOrders: OrderRow[] = [];

  for (const [sellerId, sellerItems] of groupedBySeller.entries()) {
    const subtotal = getCheckoutSubtotal(sellerItems);
    const total = subtotal + input.shippingCost;

    const orderPayload: OrderInsert = {
      buyer_id: input.buyerId,
      seller_id: sellerId,
      total,
      shipping_address: input.shippingAddress,
      shipping_method: input.shippingMethod,
      shipping_cost: input.shippingCost,
      payment_method: input.paymentMethod,
      payment_status: "menunggu_pembayaran",
      order_status:
        input.paymentMethod === "cod"
          ? "menunggu_konfirmasi_penjual"
          : "menunggu_pembayaran",
      notes: input.notes || null,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    const orderItemsPayload: OrderItemInsert[] = sellerItems.map((item) => {
      if (!item.products) {
        throw new Error("Ada produk yang tidak valid di keranjang.");
      }

      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(item.products.price),
      };
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (orderItemsError) {
      throw orderItemsError;
    }

    createdOrders.push(order as OrderRow);
  }

  const { error: clearCartError } = await supabase
    .from("carts")
    .delete()
    .eq("buyer_id", input.buyerId);

  if (clearCartError) {
    throw clearCartError;
  }

  return createdOrders;
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) {
    return "Rp 0";
  }

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}