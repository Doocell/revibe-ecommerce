import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export async function addProductToCart({
    buyerId,
    productId,
    quantity = 1,
}: {
    buyerId: string;
    productId: string;
    quantity?: number;
}) {
    const cleanBuyerId = String(buyerId ?? "").trim();
    const cleanProductId = String(productId ?? "").trim();
    const cleanQuantity = Number(quantity || 1);

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    if (!cleanProductId || cleanProductId === "undefined") {
        throw new Error("ID produk tidak valid.");
    }

    if (!Number.isFinite(cleanQuantity) || cleanQuantity <= 0) {
        throw new Error("Jumlah produk tidak valid.");
    }

    const { data: product, error: productError } = await db
        .from("products")
        .select("id, seller_id, title, stock, status")
        .eq("id", cleanProductId)
        .maybeSingle();

    if (productError) {
        throw new Error(productError.message);
    }

    if (!product) {
        throw new Error("Produk tidak ditemukan.");
    }

    if (String(product.seller_id) === cleanBuyerId) {
        throw new Error("Seller tidak bisa membeli produknya sendiri.");
    }

    if (String(product.status ?? "") !== "approved") {
        throw new Error("Produk belum tersedia untuk dibeli.");
    }

    if (Number(product.stock ?? 0) <= 0) {
        throw new Error("Stok produk habis.");
    }

    const { data: existingCart, error: findError } = await db
        .from("cart_items")
        .select("id, quantity")
        .eq("buyer_id", cleanBuyerId)
        .eq("product_id", cleanProductId)
        .maybeSingle();

    if (findError) {
        throw new Error(findError.message);
    }

    const nextQuantity = existingCart
        ? Number(existingCart.quantity ?? 0) + cleanQuantity
        : cleanQuantity;

    if (nextQuantity > Number(product.stock ?? 0)) {
        throw new Error("Jumlah di keranjang melebihi stok produk.");
    }

    if (existingCart) {
        const { data, error } = await db
            .from("cart_items")
            .update({
                quantity: nextQuantity,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existingCart.id)
            .eq("buyer_id", cleanBuyerId)
            .select("*")
            .single();

        if (error) {
            throw new Error(error.message);
        }

        notifyCartChanged();

        return data;
    }

    const { data, error } = await db
        .from("cart_items")
        .insert({
            buyer_id: cleanBuyerId,
            product_id: cleanProductId,
            quantity: cleanQuantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    notifyCartChanged();

    return data;
}

export async function checkWishlistStatus({
    buyerId,
    productId,
}: {
    buyerId: string;
    productId: string;
}) {
    const cleanBuyerId = String(buyerId ?? "").trim();
    const cleanProductId = String(productId ?? "").trim();

    if (!cleanBuyerId || !cleanProductId) return false;

    const { data, error } = await db
        .from("wishlists")
        .select("id")
        .eq("buyer_id", cleanBuyerId)
        .eq("product_id", cleanProductId)
        .maybeSingle();

    if (error) {
        return false;
    }

    return Boolean(data);
}

export async function toggleProductWishlist({
    buyerId,
    productId,
    currentStatus,
}: {
    buyerId: string;
    productId: string;
    currentStatus: boolean;
}) {
    const cleanBuyerId = String(buyerId ?? "").trim();
    const cleanProductId = String(productId ?? "").trim();

    if (!cleanBuyerId || cleanBuyerId === "undefined") {
        throw new Error("ID buyer tidak valid.");
    }

    if (!cleanProductId || cleanProductId === "undefined") {
        throw new Error("ID produk tidak valid.");
    }

    if (currentStatus) {
        const { error } = await db
            .from("wishlists")
            .delete()
            .eq("buyer_id", cleanBuyerId)
            .eq("product_id", cleanProductId);

        if (error) {
            throw new Error(error.message);
        }

        return false;
    }

    const { error } = await db.from("wishlists").insert({
        buyer_id: cleanBuyerId,
        product_id: cleanProductId,
        created_at: new Date().toISOString(),
    });

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

function notifyCartChanged() {
    window.dispatchEvent(new Event("cart-updated"));
}