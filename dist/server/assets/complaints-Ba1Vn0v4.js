import { s as supabase } from "./Navbar-BfYtpR_3.js";
const db = supabase;
const COMPLAINT_REASONS = [
  {
    value: "barang_tidak_sesuai",
    label: "Barang tidak sesuai deskripsi"
  },
  {
    value: "barang_rusak",
    label: "Barang rusak"
  },
  {
    value: "belum_sampai",
    label: "Barang belum sampai"
  },
  {
    value: "resi_bermasalah",
    label: "Nomor resi bermasalah"
  },
  {
    value: "barang_kurang",
    label: "Barang kurang"
  },
  {
    value: "lainnya",
    label: "Lainnya"
  }
];
async function getBuyerComplaintOrders(buyerId) {
  if (!buyerId) return [];
  const { data: orders, error: ordersError } = await db.from("orders").select(
    `
      id,
      buyer_id,
      seller_id,
      order_status,
      payment_status,
      total,
      tracking_number,
      courier,
      created_at,
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
    `
  ).eq("buyer_id", buyerId).order("created_at", { ascending: false });
  if (ordersError) {
    throw new Error(ordersError.message);
  }
  const orderRows = (orders ?? []).map(normalizeComplaintOrder).filter((order) => canBuyerComplainOrder(order));
  const orderIds = orderRows.map((order) => order.id);
  if (orderIds.length === 0) return [];
  const { data: complaints, error: complaintsError } = await db.from("order_complaints").select("*").eq("buyer_id", buyerId).in("order_id", orderIds);
  if (complaintsError) {
    throw new Error(complaintsError.message);
  }
  const complaintMap = new Map(
    (complaints ?? []).map((complaint) => [
      String(complaint.order_id),
      normalizeComplaint(complaint)
    ])
  );
  return orderRows.map((order) => ({
    ...order,
    complaint: complaintMap.get(order.id) ?? null
  }));
}
async function getSellerComplaints(sellerId) {
  if (!sellerId) return [];
  const { data, error } = await db.from("order_complaints").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(normalizeComplaint);
}
async function submitOrderComplaint({
  buyerId,
  orderId,
  sellerId,
  reason,
  description
}) {
  if (!buyerId || !orderId || !sellerId) {
    throw new Error("Data komplain tidak lengkap.");
  }
  if (!reason) {
    throw new Error("Alasan komplain wajib dipilih.");
  }
  if (!description.trim()) {
    throw new Error("Deskripsi komplain wajib diisi.");
  }
  const { data: order, error: orderError } = await db.from("orders").select("id, buyer_id, seller_id, order_status, payment_status").eq("id", orderId).eq("buyer_id", buyerId).maybeSingle();
  if (orderError) {
    throw new Error(orderError.message);
  }
  if (!order) {
    throw new Error("Order tidak ditemukan.");
  }
  if (!canBuyerComplainStatus(order.order_status)) {
    throw new Error("Order ini belum bisa dikomplain.");
  }
  const { data: existing, error: existingError } = await db.from("order_complaints").select("*").eq("buyer_id", buyerId).eq("order_id", orderId).in("status", ["open", "seller_responded"]).maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing) {
    throw new Error("Order ini masih memiliki komplain aktif.");
  }
  const { data, error } = await db.from("order_complaints").insert({
    order_id: orderId,
    buyer_id: buyerId,
    seller_id: sellerId,
    reason,
    description: description.trim(),
    status: "open",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return normalizeComplaint(data);
}
async function updateSellerComplaintResponse({
  sellerId,
  complaintId,
  response
}) {
  if (!sellerId || !complaintId) {
    throw new Error("Data respons tidak lengkap.");
  }
  if (!response.trim()) {
    throw new Error("Respons seller wajib diisi.");
  }
  const { data, error } = await db.from("order_complaints").update({
    seller_response: response.trim(),
    status: "seller_responded",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", complaintId).eq("seller_id", sellerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return normalizeComplaint(data);
}
async function resolveComplaint({
  userId,
  complaintId
}) {
  if (!userId || !complaintId) {
    throw new Error("Data komplain tidak lengkap.");
  }
  const { data, error } = await db.from("order_complaints").update({
    status: "resolved",
    resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", complaintId).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return normalizeComplaint(data);
}
async function cancelComplaint({
  buyerId,
  complaintId
}) {
  if (!buyerId || !complaintId) {
    throw new Error("Data komplain tidak lengkap.");
  }
  const { data, error } = await db.from("order_complaints").update({
    status: "cancelled",
    resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", complaintId).eq("buyer_id", buyerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return normalizeComplaint(data);
}
function canBuyerComplainOrder(order) {
  const payment = normalizeStatus(order.payment_status);
  const paid = payment === "dibayar" || payment === "paid" || payment === "settlement" || payment === "success";
  return paid && canBuyerComplainStatus(order.order_status);
}
function canBuyerComplainStatus(status) {
  const safeStatus = normalizeStatus(status);
  return safeStatus === "dikirim" || safeStatus === "shipped" || safeStatus === "selesai" || safeStatus === "pesanan_diterima" || safeStatus === "completed" || safeStatus === "delivered";
}
function complaintStatusLabel(status) {
  const labels = {
    open: "Menunggu Respons Seller",
    seller_responded: "Seller Sudah Merespons",
    resolved: "Selesai",
    cancelled: "Dibatalkan"
  };
  return labels[normalizeStatus(status)] ?? status ?? "-";
}
function complaintReasonLabel(reason) {
  const item = COMPLAINT_REASONS.find(
    (reasonItem) => reasonItem.value === reason
  );
  return item?.label ?? reason ?? "-";
}
function normalizeComplaintOrder(row) {
  return {
    id: String(row.id),
    buyer_id: String(row.buyer_id),
    seller_id: String(row.seller_id ?? ""),
    order_status: String(row.order_status ?? ""),
    payment_status: String(row.payment_status ?? ""),
    total: Number(row.total ?? 0),
    tracking_number: row.tracking_number ?? null,
    courier: row.courier ?? null,
    created_at: row.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    order_items: (row.order_items ?? []).map((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const images = Array.isArray(product?.images) ? product.images : [];
      return {
        id: String(item.id),
        product_id: String(item.product_id),
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
        title: String(product?.title ?? "Produk"),
        image: images[0] ?? null
      };
    }),
    complaint: null
  };
}
function normalizeComplaint(row) {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    buyer_id: String(row.buyer_id),
    seller_id: String(row.seller_id),
    reason: String(row.reason ?? ""),
    description: String(row.description ?? ""),
    status: String(row.status ?? "open"),
    seller_response: row.seller_response ?? null,
    created_at: row.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: row.updated_at ?? null,
    resolved_at: row.resolved_at ?? null
  };
}
function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}
export {
  COMPLAINT_REASONS as C,
  complaintReasonLabel as a,
  complaintStatusLabel as b,
  cancelComplaint as c,
  getSellerComplaints as d,
  getBuyerComplaintOrders as g,
  resolveComplaint as r,
  submitOrderComplaint as s,
  updateSellerComplaintResponse as u
};
