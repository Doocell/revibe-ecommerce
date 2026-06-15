import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type SellerOrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    title: string;
    images: string[] | null;
  } | null;
};

export type SellerOrder = {
  id: string;
  buyer_id: string;
  seller_id: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_cost: number | null;
  subtotal: number | null;
  total: number | null;
  courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  created_at: string;
  order_items: SellerOrderItem[];
};

export async function getSellerOrders(sellerId: string) {
  const cleanSellerId = String(sellerId ?? "").trim();

  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }

  const { data, error } = await db
    .from("orders")
    .select(
      `
      *,
      order_items(
        id,
        product_id,
        quantity,
        price,
        products(
          id,
          title,
          images
        )
      )
    `,
    )
    .eq("seller_id", cleanSellerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SellerOrder[];
}

export async function acceptSellerOrder({
  sellerId,
  orderId,
}: {
  sellerId: string;
  orderId: string;
}) {
  const { data, error } = await db
    .from("orders")
    .update({
      order_status: "diproses_penjual",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SellerOrder;
}

export async function shipSellerOrder({
  sellerId,
  orderId,
  courier,
  trackingNumber,
}: {
  sellerId: string;
  orderId: string;
  courier: string;
  trackingNumber: string;
}) {
  if (!courier.trim()) {
    throw new Error("Jasa pengiriman wajib diisi.");
  }

  if (!trackingNumber.trim()) {
    throw new Error("Nomor resi wajib diisi.");
  }

  const { data, error } = await db
    .from("orders")
    .update({
      order_status: "dikirim",
      courier: courier.trim(),
      tracking_number: trackingNumber.trim(),
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SellerOrder;
}

export function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    diproses_penjual: "Diproses Penjual",
    dikirim: "Dikirim",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };

  return labels[status] ?? status;
}

export function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan",
  };

  return labels[status] ?? status;
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}