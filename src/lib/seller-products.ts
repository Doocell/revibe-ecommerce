import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type SellerCategory = {
  id: string;
  name: string;
  slug: string | null;
};

export type SellerProduct = {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  condition: string;
  location: string | null;
  stock: number;
  sold: number | null;
  images: string[] | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  categories?: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
};

export type CreateSellerProductPayload = {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string | null;
  condition: string;
  location: string;
  stock: number;
  images: string[];
};

export async function getSellerCategories() {
  const { data, error } = await db
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SellerCategory[];
}

export async function getSellerProducts(sellerId: string) {
  const cleanSellerId = String(sellerId ?? "").trim();

  if (!cleanSellerId || cleanSellerId === "undefined") {
    throw new Error("ID seller tidak valid.");
  }

  const { data, error } = await db
    .from("products")
    .select(
      `
      *,
      categories(id, name, slug)
    `,
    )
    .eq("seller_id", cleanSellerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SellerProduct[];
}

export async function createSellerProduct(payload: CreateSellerProductPayload) {
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

  const { data, error } = await db
    .from("products")
    .insert({
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
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SellerProduct;
}

export async function updateSellerProductStatus({
  sellerId,
  productId,
  status,
}: {
  sellerId: string;
  productId: string;
  status: "pending" | "inactive";
}) {
  const { data, error } = await db
    .from("products")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SellerProduct;
}

export async function updateSellerProductStock({
  sellerId,
  productId,
  stock,
}: {
  sellerId: string;
  productId: string;
  stock: number;
}) {
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Stok tidak valid.");
  }

  const { data, error } = await db
    .from("products")
    .update({
      stock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SellerProduct;
}

export function productStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Disetujui",
    rejected: "Ditolak",
    inactive: "Nonaktif",
  };

  return labels[status] ?? status;
}

export function conditionLabel(condition: string) {
  const labels: Record<string, string> = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup",
  };

  return labels[condition] ?? condition;
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

export function parseImageUrls(value: string) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}