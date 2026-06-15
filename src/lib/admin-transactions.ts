import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AdminOrderItem = {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  quantity: number;
  price: number;
  line_total: number;
};

export type AdminTransaction = {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_cost: number;
  subtotal: number;
  total: number;
  stock_deducted: boolean;
  stock_restored: boolean;
  stock_restored_at: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  order_items: AdminOrderItem[];
};

export type AdminTransactionFilter = {
  orderStatus?: string;
  paymentStatus?: string;
  search?: string;
  limit?: number;
};

type RawOrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_cost: number | string | null;
  subtotal?: number | string | null;
  total: number | string | null;
  stock_deducted?: boolean | null;
  stock_restored?: boolean | null;
  stock_restored_at?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  courier?: string | null;
  tracking_number: string | null;
  shipped_at?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  order_items?: any[];
};

const RESTORE_MARKER = "[ADMIN_STOCK_RESTORED]";

const EXTENDED_ORDER_SELECT = `
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
  stock_deducted,
  stock_restored,
  stock_restored_at,
  cancel_reason,
  cancelled_at,
  courier,
  tracking_number,
  shipped_at,
  notes,
  created_at,
  updated_at,
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
`;

const BASE_ORDER_SELECT = `
  id,
  buyer_id,
  seller_id,
  order_status,
  payment_status,
  payment_method,
  shipping_method,
  shipping_address,
  shipping_cost,
  total,
  tracking_number,
  notes,
  created_at,
  updated_at,
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
`;

export async function getAdminTransactions(
  filters: AdminTransactionFilter = {},
): Promise<AdminTransaction[]> {
  const limit = filters.limit ?? 150;

  const rawOrders = await fetchOrdersWithFallback({
    selectSql: EXTENDED_ORDER_SELECT,
    fallbackSelectSql: BASE_ORDER_SELECT,
    orderStatus: filters.orderStatus,
    paymentStatus: filters.paymentStatus,
    limit,
  });

  const profileIds = Array.from(
    new Set(
      rawOrders
        .flatMap((order) => [order.buyer_id, order.seller_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const profileMap = await getProfileMap(profileIds);

  let rows = rawOrders.map((order) => normalizeAdminTransaction(order, profileMap));

  const search = String(filters.search ?? "").trim().toLowerCase();

  if (search) {
    rows = rows.filter((order) => {
      const productText = order.order_items
        .map((item) => item.product_title)
        .join(" ")
        .toLowerCase();

      return [
        order.id,
        order.buyer_name,
        order.seller_name,
        order.tracking_number ?? "",
        order.payment_method ?? "",
        order.shipping_method ?? "",
        productText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }

  return rows;
}

async function fetchOrdersWithFallback({
  selectSql,
  fallbackSelectSql,
  orderStatus,
  paymentStatus,
  limit,
}: {
  selectSql: string;
  fallbackSelectSql: string;
  orderStatus?: string;
  paymentStatus?: string;
  limit: number;
}) {
  const firstResult = await runOrderQuery({
    selectSql,
    orderStatus,
    paymentStatus,
    limit,
  });

  if (!firstResult.error) {
    return (firstResult.data ?? []) as RawOrderRow[];
  }

  if (!isMissingColumnError(firstResult.error.message)) {
    throw new Error(firstResult.error.message);
  }

  const secondResult = await runOrderQuery({
    selectSql: fallbackSelectSql,
    orderStatus,
    paymentStatus,
    limit,
  });

  if (secondResult.error) {
    throw new Error(secondResult.error.message);
  }

  return (secondResult.data ?? []) as RawOrderRow[];
}

async function runOrderQuery({
  selectSql,
  orderStatus,
  paymentStatus,
  limit,
}: {
  selectSql: string;
  orderStatus?: string;
  paymentStatus?: string;
  limit: number;
}) {
  let query = db
    .from("orders")
    .select(selectSql)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (orderStatus) {
    query = query.eq("order_status", orderStatus);
  }

  if (paymentStatus) {
    query = query.eq("payment_status", paymentStatus);
  }

  return query;
}

async function getProfileMap(profileIds: string[]) {
  const map = new Map<
    string,
    {
      full_name: string | null;
      shop_name: string | null;
    }
  >();

  if (profileIds.length === 0) {
    return map;
  }

  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, shop_name")
    .in("id", profileIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const profile of data ?? []) {
    map.set(String(profile.id), {
      full_name: profile.full_name ?? null,
      shop_name: profile.shop_name ?? null,
    });
  }

  return map;
}

function normalizeAdminTransaction(
  order: RawOrderRow,
  profileMap: Map<
    string,
    {
      full_name: string | null;
      shop_name: string | null;
    }
  >,
): AdminTransaction {
  const items = Array.isArray(order.order_items)
    ? order.order_items.map(normalizeOrderItem)
    : [];

  const computedSubtotal = items.reduce((sum, item) => sum + item.line_total, 0);

  const buyerProfile = profileMap.get(String(order.buyer_id));
  const sellerProfile = profileMap.get(String(order.seller_id));

  return {
    id: String(order.id),
    buyer_id: String(order.buyer_id),
    seller_id: String(order.seller_id),
    buyer_name: buyerProfile?.full_name || "Buyer",
    seller_name: sellerProfile?.shop_name || sellerProfile?.full_name || "Seller",
    order_status: String(order.order_status ?? "-"),
    payment_status: String(order.payment_status ?? "-"),
    payment_method: order.payment_method ?? null,
    shipping_method: order.shipping_method ?? null,
    shipping_address: order.shipping_address ?? null,
    shipping_cost: Number(order.shipping_cost ?? 0),
    subtotal: Number(order.subtotal ?? computedSubtotal),
    total: Number(order.total ?? computedSubtotal + Number(order.shipping_cost ?? 0)),
    stock_deducted: Boolean(order.stock_deducted ?? true),
    stock_restored:
      Boolean(order.stock_restored) || String(order.notes ?? "").includes(RESTORE_MARKER),
    stock_restored_at: order.stock_restored_at ?? null,
    cancel_reason: order.cancel_reason ?? getCancelReasonFromNotes(order.notes),
    cancelled_at: order.cancelled_at ?? null,
    courier: order.courier ?? null,
    tracking_number: order.tracking_number ?? null,
    shipped_at: order.shipped_at ?? null,
    notes: order.notes ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at ?? null,
    order_items: items,
  };
}

function normalizeOrderItem(item: any): AdminOrderItem {
  const product = Array.isArray(item.products)
    ? item.products[0] ?? null
    : item.products ?? null;

  const quantity = Number(item.quantity ?? 0);
  const price = Number(item.price ?? 0);

  return {
    id: String(item.id),
    product_id: String(item.product_id),
    product_title: product?.title ?? "Produk",
    product_image: Array.isArray(product?.images) ? product.images[0] ?? null : null,
    quantity,
    price,
    line_total: quantity * price,
  };
}

export async function updateAdminOrderStatus({
  orderId,
  orderStatus,
}: {
  orderId: string;
  orderStatus: string;
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }

  const { error } = await db
    .from("orders")
    .update({
      order_status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAdminPaymentStatus({
  orderId,
  paymentStatus,
}: {
  orderId: string;
  paymentStatus: string;
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }

  const candidates =
    paymentStatus === "dibayar"
      ? ["dibayar", "pembayaran_berhasil"]
      : [paymentStatus];

  let lastError: string | null = null;

  for (const candidate of candidates) {
    const { error } = await db
      .from("orders")
      .update({
        payment_status: candidate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (!error) {
      return;
    }

    lastError = error.message;
  }

  throw new Error(lastError ?? "Gagal memperbarui status pembayaran.");
}

export async function cancelAdminTransaction({
  orderId,
  reason,
}: {
  orderId: string;
  reason: string;
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }

  const cleanReason = reason.trim() || "Dibatalkan oleh admin.";
  const now = new Date().toISOString();

  const extendedPayload = {
    order_status: "dibatalkan",
    cancel_reason: cleanReason,
    cancelled_at: now,
    updated_at: now,
  };

  const firstResult = await db
    .from("orders")
    .update(extendedPayload)
    .eq("id", orderId);

  if (!firstResult.error) {
    return;
  }

  if (!isMissingColumnError(firstResult.error.message)) {
    throw new Error(firstResult.error.message);
  }

  const order = await getBasicOrder(orderId);
  const notes = appendAdminNote(order?.notes ?? null, `Pembatalan: ${cleanReason}`);

  const { error } = await db
    .from("orders")
    .update({
      order_status: "dibatalkan",
      notes,
      updated_at: now,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function restoreAdminTransactionStock(orderId: string) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }

  const order = await getOrderForStockRestore(orderId);

  if (!order) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (Boolean(order.stock_restored) || String(order.notes ?? "").includes(RESTORE_MARKER)) {
    throw new Error("Stok transaksi ini sudah pernah dikembalikan.");
  }

  const items = Array.isArray(order.order_items) ? order.order_items : [];

  if (items.length === 0) {
    throw new Error("Item transaksi tidak ditemukan.");
  }

  for (const item of items) {
    const productId = String(item.product_id ?? "");
    const quantity = Number(item.quantity ?? 0);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    await incrementProductStock({
      productId,
      quantity,
    });
  }

  const now = new Date().toISOString();

  const extendedPayload = {
    stock_restored: true,
    stock_restored_at: now,
    notes: appendAdminNote(order.notes ?? null, `${RESTORE_MARKER} Stok dikembalikan admin.`),
    updated_at: now,
  };

  const firstResult = await db
    .from("orders")
    .update(extendedPayload)
    .eq("id", orderId);

  if (!firstResult.error) {
    return;
  }

  if (!isMissingColumnError(firstResult.error.message)) {
    throw new Error(firstResult.error.message);
  }

  const { error } = await db
    .from("orders")
    .update({
      notes: appendAdminNote(order.notes ?? null, `${RESTORE_MARKER} Stok dikembalikan admin.`),
      updated_at: now,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

async function getBasicOrder(orderId: string) {
  const { data, error } = await db
    .from("orders")
    .select("id, notes")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as { id: string; notes: string | null } | null;
}

async function getOrderForStockRestore(orderId: string) {
  const extendedResult = await db
    .from("orders")
    .select(
      `
      id,
      notes,
      stock_restored,
      order_items(
        id,
        product_id,
        quantity
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!extendedResult.error) {
    return extendedResult.data as any;
  }

  if (!isMissingColumnError(extendedResult.error.message)) {
    throw new Error(extendedResult.error.message);
  }

  const baseResult = await db
    .from("orders")
    .select(
      `
      id,
      notes,
      order_items(
        id,
        product_id,
        quantity
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (baseResult.error) {
    throw new Error(baseResult.error.message);
  }

  return baseResult.data as any;
}

async function incrementProductStock({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) {
  const rpcResult = await db.rpc("increment_product_stock", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (!rpcResult.error) {
    return;
  }

  const { data: product, error: productError } = await db
    .from("products")
    .select("id, stock")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    throw new Error("Produk tidak ditemukan saat restore stok.");
  }

  const currentStock = Number(product.stock ?? 0);

  const { error: updateError } = await db
    .from("products")
    .update({
      stock: currentStock + quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

function appendAdminNote(notes: string | null, message: string) {
  const current = String(notes ?? "").trim();
  const next = `[ADMIN] ${new Date().toLocaleString("id-ID")} - ${message}`;

  return current ? `${current}\n${next}` : next;
}

function getCancelReasonFromNotes(notes: string | null) {
  const value = String(notes ?? "");

  if (!value.toLowerCase().includes("pembatalan")) {
    return null;
  }

  return value;
}

function isMissingColumnError(message: string) {
  const value = message.toLowerCase();

  return (
    value.includes("column") &&
    (value.includes("does not exist") ||
      value.includes("schema cache") ||
      value.includes("could not find"))
  );
}

export function formatIDR(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return "Rp 0";
  }

  return "Rp " + new Intl.NumberFormat("id-ID").format(numberValue);
}

export function orderStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    diproses_penjual: "Diproses Penjual",
    dikirim: "Dikirim",
    pesanan_diterima: "Pesanan Diterima",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };

  if (!status) return "-";

  return labels[status] ?? status;
}

export function paymentStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    pembayaran_diproses: "Pembayaran Diproses",
    pembayaran_berhasil: "Dibayar",
    pembayaran_gagal: "Pembayaran Gagal",
    kedaluwarsa: "Kedaluwarsa",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan",
  };

  if (!status) return "-";

  return labels[status] ?? status;
}

export function paymentMethodLabel(method: string | null) {
  const labels: Record<string, string> = {
    transfer_bank: "Transfer Bank Manual",
    ewallet: "E-Wallet Manual",
    cod: "COD / Bayar di Tempat",
    qris: "QRIS",
  };

  if (!method) return "-";

  return labels[method] ?? method;
}

export function shippingMethodLabel(method: string | null) {
  const labels: Record<string, string> = {
    regular: "Regular",
    instant: "Instant",
    same_day: "Same Day",
    pickup: "Ambil Sendiri",
    Reguler: "Reguler",
    Hemat: "Hemat",
    Express: "Express",
  };

  if (!method) return "-";

  return labels[method] ?? method;
}