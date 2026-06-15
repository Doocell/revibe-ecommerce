import { s as supabase } from "./Navbar-BfYtpR_3.js";
const db = supabase;
async function getSellerCategories() {
  const { data, error } = await db.from("categories").select("id, name, slug").order("name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
async function getSellerProducts(sellerId) {
  const cleanSellerId = String(sellerId ?? "").trim();
  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }
  const { data, error } = await db.from("products").select(
    `
      *,
      categories(id, name, slug)
    `
  ).eq("seller_id", cleanSellerId).order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
async function createSellerProduct(payload) {
  const cleanSellerId = String(payload.sellerId ?? "").trim();
  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }
  if (!payload.title.trim()) {
    throw new Error("Nama produk wajib diisi.");
  }
  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    throw new Error("Harga produk wajib lebih dari 0.");
  }
  if (!Number.isFinite(payload.stock) || payload.stock < 0) {
    throw new Error("Stok produk tidak valid.");
  }
  const { data, error } = await db.from("products").insert({
    seller_id: cleanSellerId,
    title: payload.title.trim(),
    description: payload.description.trim() || null,
    price: payload.price,
    original_price: payload.original_price,
    category_id: payload.category_id,
    condition: payload.condition,
    location: payload.location.trim() || null,
    stock: payload.stock,
    images: payload.images,
    status: "pending"
  }).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function updateSellerProductStatus({
  sellerId,
  productId,
  status
}) {
  const { data, error } = await db.from("products").update({
    status,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", productId).eq("seller_id", sellerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function updateSellerProductStock({
  sellerId,
  productId,
  stock
}) {
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Stok tidak valid.");
  }
  const { data, error } = await db.from("products").update({
    stock,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", productId).eq("seller_id", sellerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
function productStatusLabel(status) {
  const labels = {
    pending: "Menunggu Verifikasi",
    approved: "Disetujui",
    rejected: "Ditolak",
    inactive: "Nonaktif"
  };
  return labels[status] ?? status;
}
function conditionLabel(condition) {
  const labels = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup"
  };
  return labels[condition] ?? condition;
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
function parseImageUrls(value) {
  return String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
}
export {
  createSellerProduct as a,
  getSellerProducts as b,
  conditionLabel as c,
  productStatusLabel as d,
  updateSellerProductStock as e,
  formatIDR as f,
  getSellerCategories as g,
  parseImageUrls as p,
  updateSellerProductStatus as u
};
