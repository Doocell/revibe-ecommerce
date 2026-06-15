import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type BuyerOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number | string;
  products: {
    id: string;
    title: string;
    images: string[] | null;
    price: number | string;
  } | null;
};

export type BuyerOrder = {
  id: string;
  buyer_id: string;
  seller_id: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_cost: number | string | null;
  subtotal: number | string | null;
  total: number | string | null;
  notes: string | null;
  courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  stock_restored: boolean | null;
  stock_restored_at: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string | null;
  seller: {
    id: string;
    full_name: string | null;
    shop_name: string | null;
  } | null;
  order_items: BuyerOrderItem[];
};

type RawOrderRow = Omit<BuyerOrder, "seller" | "order_items"> & {
  order_items: any[];
};

export async function getBuyerOrders(buyerId: string): Promise<BuyerOrder[]> {
  if (!buyerId) {
    throw new Error("ID pembeli tidak valid.");
  }

  const { data: ordersData, error: ordersError } = await db
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      seller_id,
      order_status,
      payment_status,
      payment_method,
      shipping_method,
      shipping_address,
      shipping_cost,
      subtotal,
      total,
      notes,
      courier,
      tracking_number,
      shipped_at,
      stock_restored,
      stock_restored_at,
      cancel_reason,
      cancelled_at,
      created_at,
      updated_at,
      order_items(
        id,
        order_id,
        product_id,
        quantity,
        price,
        products(
          id,
          title,
          images,
          price
        )
      )
    `,
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const rawOrders = (ordersData ?? []) as RawOrderRow[];

  const sellerIds = Array.from(
    new Set(
      rawOrders
        .map((order) => String(order.seller_id ?? ""))
        .filter((sellerId) => sellerId.length > 0),
    ),
  );

  let sellerMap = new Map<
    string,
    {
      id: string;
      full_name: string | null;
      shop_name: string | null;
    }
  >();

  if (sellerIds.length > 0) {
    const { data: sellersData, error: sellersError } = await db
      .from("profiles")
      .select("id, full_name, shop_name")
      .in("id", sellerIds);

    if (sellersError) {
      throw new Error(sellersError.message);
    }

    sellerMap = new Map(
      (sellersData ?? []).map((seller: any) => [
        String(seller.id),
        {
          id: seller.id,
          full_name: seller.full_name ?? null,
          shop_name: seller.shop_name ?? null,
        },
      ]),
    );
  }

  return rawOrders.map((order) => normalizeBuyerOrder(order, sellerMap));
}

export async function confirmOrderReceived({
  orderId,
  buyerId,
}: {
  orderId: string;
  buyerId: string;
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }

  if (!buyerId) {
    throw new Error("ID pembeli tidak valid.");
  }

  const { data: existingOrder, error: existingOrderError } = await db
    .from("orders")
    .select("id, buyer_id, order_status, payment_status")
    .eq("id", orderId)
    .eq("buyer_id", buyerId)
    .maybeSingle();

  if (existingOrderError) {
    throw new Error(existingOrderError.message);
  }

  if (!existingOrder) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  if (String(existingOrder.order_status) !== "dikirim") {
    throw new Error("Pesanan hanya bisa dikonfirmasi setelah status dikirim.");
  }

  const { data, error } = await db
    .from("orders")
    .update({
      order_status: "selesai",
      payment_status: "dibayar",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("buyer_id", buyerId)
    .select(
      `
      id,
      buyer_id,
      seller_id,
      order_status,
      payment_status,
      updated_at
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function cancelBuyerOrder({
  orderId,
  buyerId,
}: {
  orderId: string;
  buyerId: string;
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }

  if (!buyerId) {
    throw new Error("ID pembeli tidak valid.");
  }

  const { data: order, error: orderError } = await db
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      seller_id,
      order_status,
      payment_status,
      stock_restored,
      order_items(
        id,
        product_id,
        quantity
      )
    `,
    )
    .eq("id", orderId)
    .eq("buyer_id", buyerId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  const currentStatus = String(order.order_status ?? "");

  const cancellableStatuses = [
    "menunggu_pembayaran",
    "menunggu_konfirmasi_penjual",
    "diproses_penjual",
  ];

  if (!cancellableStatuses.includes(currentStatus)) {
    throw new Error(
      "Pesanan tidak dapat dibatalkan karena sudah dikirim, selesai, atau sudah dibatalkan.",
    );
  }

  const orderItems = Array.isArray(order.order_items)
    ? order.order_items
    : [];

  const shouldRestoreStock = !Boolean(order.stock_restored);

  if (shouldRestoreStock) {
    for (const item of orderItems) {
      const productId = String(item.product_id ?? "");
      const quantity = Number(item.quantity ?? 0);

      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }

      await restoreProductStock({
        productId,
        quantity,
      });
    }
  }

  const { data: updatedOrder, error: updateOrderError } = await db
    .from("orders")
    .update({
      order_status: "dibatalkan",
      cancel_reason: "Dibatalkan oleh pembeli.",
      cancelled_at: new Date().toISOString(),
      stock_restored: true,
      stock_restored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("buyer_id", buyerId)
    .select(
      `
      id,
      buyer_id,
      seller_id,
      order_status,
      payment_status,
      stock_restored,
      stock_restored_at,
      cancel_reason,
      cancelled_at,
      updated_at
    `,
    )
    .single();

  if (updateOrderError) {
    throw new Error(updateOrderError.message);
  }

  return updatedOrder;
}

async function restoreProductStock({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) {
  const { error: rpcError } = await db.rpc("increment_product_stock", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (!rpcError) return;

  const { data: product, error: productError } = await db
    .from("products")
    .select("id, stock")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    throw new Error("Produk tidak ditemukan saat mengembalikan stok.");
  }

  const currentStock = Number(product.stock ?? 0);
  const nextStock = currentStock + quantity;

  const { error: updateStockError } = await db
    .from("products")
    .update({
      stock: nextStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateStockError) {
    throw new Error(updateStockError.message);
  }
}

function normalizeBuyerOrder(
  row: RawOrderRow,
  sellerMap: Map<
    string,
    {
      id: string;
      full_name: string | null;
      shop_name: string | null;
    }
  >,
): BuyerOrder {
  const orderItems = Array.isArray(row.order_items)
    ? row.order_items.map((item: any) => {
      const productValue = Array.isArray(item.products)
        ? item.products[0] ?? null
        : item.products ?? null;

      return {
        ...item,
        products: productValue,
      };
    })
    : [];

  return {
    ...row,
    seller: sellerMap.get(String(row.seller_id ?? "")) ?? null,
    order_items: orderItems,
  } as BuyerOrder;
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

export function paymentMethodLabel(method: string | null) {
  const labels: Record<string, string> = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    qris: "QRIS",
  };

  return labels[String(method ?? "")] ?? method ?? "-";
}

export function paymentStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan",
  };

  return labels[String(status ?? "")] ?? status ?? "-";
}

export function orderStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    diproses_penjual: "Diproses Penjual",
    dikirim: "Dikirim / Dalam Pengiriman",
    pesanan_diterima: "Pesanan Diterima",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };

  return labels[String(status ?? "")] ?? status ?? "-";
}