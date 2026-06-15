import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type OrderRow = Tables<"orders">;

export async function simulateManualPayment({
  orderId,
  buyerId,
}: {
  orderId: string;
  buyerId: string;
}) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, payment_method, payment_status, order_status")
    .eq("id", orderId)
    .eq("buyer_id", buyerId)
    .single();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    throw new Error("Order tidak ditemukan.");
  }

  if (order.payment_method === "cod") {
    throw new Error("Order COD tidak perlu dibayar manual di awal.");
  }

  if (order.payment_status === "dibayar" && order.order_status !== "menunggu_pembayaran") {
    throw new Error("Order ini sudah dibayar.");
  }

  if (order.order_status === "dibatalkan") {
    throw new Error("Order yang dibatalkan tidak bisa dibayar.");
  }

  if (order.order_status === "selesai") {
    throw new Error("Order yang sudah selesai tidak bisa dibayar ulang.");
  }

  const { data, error } = await supabase.rpc("pay_order_and_deduct_stock", {
    p_order_id: orderId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as OrderRow;
}