import { s as supabase } from "./Navbar-BfYtpR_3.js";
const db = supabase;
const REVIEWABLE_ORDER_STATUSES = [
  "selesai",
  "pesanan_diterima",
  "diterima",
  "completed",
  "delivered"
];
async function getReviewableItems(buyerId) {
  if (!buyerId) {
    throw new Error("ID pembeli tidak valid.");
  }
  const { data: orders, error: ordersError } = await db.from("orders").select("id, seller_id, order_status, payment_status, created_at").eq("buyer_id", buyerId).order("created_at", { ascending: false });
  if (ordersError) {
    throw new Error(ordersError.message);
  }
  const allOrderRows = (orders ?? []).map(normalizeOrder);
  const reviewableOrders = allOrderRows.filter((order) => {
    return isReviewableOrderStatus(order.order_status) && isPaid(order.payment_status);
  });
  const orderIds = reviewableOrders.map((order) => order.id);
  if (orderIds.length === 0) return [];
  const { data: items, error: itemsError } = await db.from("order_items").select("id, order_id, product_id, quantity, price").in("order_id", orderIds);
  if (itemsError) {
    throw new Error(itemsError.message);
  }
  const itemRows = (items ?? []).map(normalizeOrderItem);
  const orderItemIds = itemRows.map((item) => item.id);
  const productIds = Array.from(
    new Set(itemRows.map((item) => item.product_id).filter(Boolean))
  );
  const [productsResult, reviewsResult] = await Promise.all([
    productIds.length > 0 ? db.from("products").select("id, seller_id, title, images").in("id", productIds) : Promise.resolve({ data: [], error: null }),
    orderItemIds.length > 0 ? db.from("reviews").select("*").eq("buyer_id", buyerId).in("order_item_id", orderItemIds) : Promise.resolve({ data: [], error: null })
  ]);
  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }
  if (reviewsResult.error) {
    throw new Error(reviewsResult.error.message);
  }
  const orderMap = new Map(reviewableOrders.map((order) => [order.id, order]));
  const productMap = new Map(
    (productsResult.data ?? []).map((product) => [
      String(product.id),
      normalizeProduct(product)
    ])
  );
  const reviewMap = new Map(
    (reviewsResult.data ?? []).map((review) => [
      String(review.order_item_id ?? ""),
      normalizeReview(review)
    ])
  );
  return itemRows.map((item) => {
    const order = orderMap.get(item.order_id);
    const product = productMap.get(item.product_id);
    return {
      orderId: item.order_id,
      orderItemId: item.id,
      productId: item.product_id,
      sellerId: product?.seller_id ?? order?.seller_id ?? null,
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
      orderStatus: order?.order_status ?? "",
      orderCreatedAt: order?.created_at ?? "",
      productTitle: product?.title ?? "Produk",
      productImage: product?.images?.[0] ?? null,
      existingReview: reviewMap.get(item.id) ?? null
    };
  });
}
async function getReviewContext({
  buyerId,
  orderId,
  productId,
  orderItemId
}) {
  if (!buyerId) {
    throw new Error("ID pembeli tidak valid.");
  }
  if (!orderId) {
    throw new Error("ID pesanan tidak valid.");
  }
  if (!productId) {
    throw new Error("ID produk tidak valid.");
  }
  const { data: orderData, error: orderError } = await db.from("orders").select("id, buyer_id, seller_id, order_status, payment_status, created_at").eq("id", orderId).eq("buyer_id", buyerId).maybeSingle();
  if (orderError) {
    throw new Error(orderError.message);
  }
  if (!orderData) {
    throw new Error("Pesanan tidak ditemukan.");
  }
  const order = normalizeOrder(orderData);
  if (!isReviewableOrderStatus(order.order_status) || !isPaid(order.payment_status)) {
    throw new Error(
      "Ulasan hanya bisa dibuat setelah pesanan selesai/diterima dan sudah dibayar."
    );
  }
  let itemQuery = db.from("order_items").select("id, order_id, product_id, quantity, price").eq("order_id", orderId).eq("product_id", productId);
  if (orderItemId) {
    itemQuery = itemQuery.eq("id", orderItemId);
  }
  const { data: itemRows, error: itemError } = await itemQuery.limit(1);
  if (itemError) {
    throw new Error(itemError.message);
  }
  const orderItemRaw = itemRows?.[0];
  if (!orderItemRaw) {
    throw new Error("Produk tidak ditemukan di dalam pesanan ini.");
  }
  const orderItem = normalizeOrderItem(orderItemRaw);
  const [productResult, reviewResult] = await Promise.all([
    db.from("products").select("id, seller_id, title, images").eq("id", productId).maybeSingle(),
    db.from("reviews").select("*").eq("buyer_id", buyerId).eq("order_item_id", orderItem.id).maybeSingle()
  ]);
  if (productResult.error) {
    throw new Error(productResult.error.message);
  }
  if (reviewResult.error) {
    throw new Error(reviewResult.error.message);
  }
  const product = productResult.data ? normalizeProduct(productResult.data) : null;
  return {
    orderId: order.id,
    orderItemId: orderItem.id,
    productId: orderItem.product_id,
    sellerId: product?.seller_id ?? order.seller_id ?? null,
    productTitle: product?.title ?? "Produk",
    productImage: product?.images?.[0] ?? null,
    orderStatus: order.order_status,
    existingReview: reviewResult.data ? normalizeReview(reviewResult.data) : null
  };
}
async function saveProductReview({
  buyerId,
  orderId,
  orderItemId,
  productId,
  sellerId,
  rating,
  comment
}) {
  if (!buyerId) {
    throw new Error("ID pembeli tidak valid.");
  }
  if (!orderId || !orderItemId || !productId) {
    throw new Error("Data ulasan tidak lengkap.");
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating wajib antara 1 sampai 5.");
  }
  const context = await getReviewContext({
    buyerId,
    orderId,
    productId,
    orderItemId
  });
  const payload = {
    order_id: orderId,
    order_item_id: orderItemId,
    product_id: productId,
    buyer_id: buyerId,
    seller_id: sellerId ?? context.sellerId,
    rating,
    comment: cleanText(comment),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { data: existingReview, error: existingError } = await db.from("reviews").select("id").eq("buyer_id", buyerId).eq("order_item_id", orderItemId).maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  let savedReview;
  if (existingReview?.id) {
    const { data, error } = await db.from("reviews").update(payload).eq("id", existingReview.id).select("*").single();
    if (error) {
      throw new Error(error.message);
    }
    savedReview = normalizeReview(data);
  } else {
    const { data, error } = await db.from("reviews").insert({
      ...payload,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select("*").single();
    if (error) {
      throw new Error(error.message);
    }
    savedReview = normalizeReview(data);
  }
  await refreshProductRating(productId);
  return savedReview;
}
async function getProductReviewSummary(productId) {
  if (!productId) {
    return {
      averageRating: 0,
      reviewCount: 0
    };
  }
  const { data, error } = await db.from("products").select("id, average_rating, review_count").eq("id", productId).maybeSingle();
  if (error) {
    console.error("[Product Review Summary Error]", error);
    return {
      averageRating: 0,
      reviewCount: 0
    };
  }
  return {
    averageRating: Number(data?.average_rating ?? 0),
    reviewCount: Number(data?.review_count ?? 0)
  };
}
async function getProductReviews(productId) {
  if (!productId) return [];
  const { data, error } = await db.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(normalizeReview);
}
async function refreshProductRating(productId) {
  const rpcResult = await db.rpc("refresh_product_review_summary", {
    p_product_id: productId
  });
  if (!rpcResult.error) return;
  console.error("[Refresh Product Rating RPC Error]", rpcResult.error);
  const { data: reviewRows, error: reviewError } = await db.from("reviews").select("rating").eq("product_id", productId);
  if (reviewError) {
    console.error("[Refresh Product Rating Fallback Read Error]", reviewError);
    return;
  }
  const ratings = (reviewRows ?? []).map((row) => Number(row.rating ?? 0));
  const reviewCount = ratings.length;
  const averageRating = reviewCount > 0 ? Number(
    (ratings.reduce((sum, value) => sum + value, 0) / reviewCount).toFixed(2)
  ) : 0;
  const { error: updateError } = await db.from("products").update({
    average_rating: averageRating,
    review_count: reviewCount,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", productId);
  if (updateError) {
    console.error("[Refresh Product Rating Fallback Update Error]", updateError);
  }
}
function isReviewableOrderStatus(status) {
  const safeStatus = normalizeStatus(status);
  return REVIEWABLE_ORDER_STATUSES.includes(safeStatus);
}
function isPaid(status) {
  const safeStatus = normalizeStatus(status);
  return safeStatus === "dibayar" || safeStatus === "paid" || safeStatus === "settlement" || safeStatus === "success";
}
function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}
function normalizeOrder(row) {
  return {
    id: String(row.id),
    seller_id: row.seller_id ? String(row.seller_id) : null,
    order_status: normalizeStatus(row.order_status),
    payment_status: normalizeStatus(row.payment_status),
    created_at: String(row.created_at ?? "")
  };
}
function normalizeOrderItem(row) {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    product_id: String(row.product_id),
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0)
  };
}
function normalizeProduct(row) {
  return {
    id: String(row.id),
    seller_id: row.seller_id ? String(row.seller_id) : null,
    title: String(row.title ?? "Produk"),
    images: Array.isArray(row.images) ? row.images.filter(Boolean) : []
  };
}
function normalizeReview(row) {
  return {
    id: String(row.id),
    order_id: row.order_id ?? null,
    order_item_id: row.order_item_id ?? null,
    product_id: String(row.product_id),
    buyer_id: String(row.buyer_id),
    seller_id: row.seller_id ?? null,
    rating: Number(row.rating ?? 0),
    comment: row.comment ?? null,
    created_at: row.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: row.updated_at ?? null
  };
}
function cleanText(value) {
  const cleanValue = value.trim();
  return cleanValue.length > 0 ? cleanValue : null;
}
export {
  getProductReviews as a,
  getReviewContext as b,
  getReviewableItems as c,
  getProductReviewSummary as g,
  saveProductReview as s
};
