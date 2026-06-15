import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  Heart,
  Loader2,
  MapPin,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ProductRatingInline } from "@/components/ProductRating";

const db = supabase as any;

type ProductLike = {
  id?: string;
  title?: string;
  name?: string;
  description?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  image_url?: string | null;
  images?: string[] | null;
  status?: string | null;
  condition?: string | null;
  location?: string | null;
  stock?: number | string | null;
  sold?: number | string | null;
  seller_id?: string | null;
  category_id?: string | null;
  average_rating?: number | string | null;
  review_count?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  categories?:
  | {
    id?: string;
    name?: string | null;
    slug?: string | null;
  }
  | {
    id?: string;
    name?: string | null;
    slug?: string | null;
  }[]
  | null;
  profiles?:
  | {
    id?: string;
    full_name?: string | null;
    shop_name?: string | null;
    shop_location?: string | null;
  }
  | {
    id?: string;
    full_name?: string | null;
    shop_name?: string | null;
    shop_location?: string | null;
  }[]
  | null;
  seller?:
  | {
    id?: string;
    full_name?: string | null;
    shop_name?: string | null;
    shop_location?: string | null;
  }
  | null;
  [key: string]: any;
};

type ProductCardProps = {
  product: ProductLike;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  showWishlist?: boolean;
  showSeller?: boolean;
  onCartUpdated?: () => void;
  onWishlistUpdated?: () => void;
};

export function ProductCard({
  product,
  className = "",
  compact = false,
  showActions = true,
  showWishlist = true,
  showSeller = true,
  onCartUpdated,
  onWishlistUpdated,
}: ProductCardProps) {
  const { user, roles } = useAuth();

  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const safeRoles = roles ?? [];
  const isBuyer = safeRoles.includes("buyer");

  const productId = String(product?.id ?? "");
  const title = String(product?.title ?? product?.name ?? "Produk");
  const description = String(product?.description ?? "");
  const price = Number(product?.price ?? 0);
  const originalPrice = Number(product?.original_price ?? 0);
  const stock = Number(product?.stock ?? 0);
  const sold = Number(product?.sold ?? 0);
  const status = String(product?.status ?? "");
  const condition = String(product?.condition ?? "");
  const location = String(product?.location ?? "");
  const categoryName = getCategoryName(product);
  const sellerName = getSellerName(product);

  const images = useMemo(() => {
    if (Array.isArray(product?.images)) {
      return product.images.filter(Boolean);
    }

    if (product?.image_url) {
      return [String(product.image_url)];
    }

    return [];
  }, [product]);

  const image = images[0] ?? "";
  const detailUrl = `/detail-produk?id=${productId}`;
  const isApproved = status === "approved" || status === "active";
  const isAvailable = isApproved && stock > 0;
  const discountPercent =
    originalPrice > price && price > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  useEffect(() => {
    loadWishlistStatus();
  }, [user?.id, productId]);

  async function loadWishlistStatus() {
    if (!user?.id || !productId || !isBuyer) {
      setWishlisted(false);
      return;
    }

    try {
      const result = await findWishlistItem({
        buyerId: user.id,
        productId,
      });

      setWishlisted(Boolean(result?.id));
    } catch (error) {
      console.error("[ProductCard Wishlist Status Error]", error);
    }
  }

  async function ensureBuyer() {
    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli terlebih dahulu.");
      window.location.href = "/login/pembeli";
      return false;
    }

    if (!isBuyer) {
      toast.error("Fitur ini hanya untuk akun pembeli.");
      return false;
    }

    if (!productId) {
      toast.error("ID produk tidak valid.");
      return false;
    }

    if (!isAvailable) {
      toast.error("Produk belum tersedia atau stok habis.");
      return false;
    }

    return true;
  }

  async function addToCart(quantity = 1) {
    const canContinue = await ensureBuyer();

    if (!canContinue || !user?.id) return false;

    const { data: existingItem, error: existingError } = await db
      .from("cart_items")
      .select("id, quantity")
      .eq("buyer_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existingItem?.id) {
      const currentQuantity = Number(existingItem.quantity ?? 0);
      const nextQuantity = currentQuantity + quantity;

      if (nextQuantity > stock) {
        throw new Error("Jumlah produk di keranjang melebihi stok.");
      }

      const { error } = await db
        .from("cart_items")
        .update({
          quantity: nextQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .eq("buyer_id", user.id);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      if (quantity > stock) {
        throw new Error("Jumlah produk melebihi stok.");
      }

      const { error } = await db.from("cart_items").insert({
        buyer_id: user.id,
        product_id: productId,
        quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    window.dispatchEvent(new Event("cart-updated"));
    onCartUpdated?.();

    return true;
  }

  async function handleAddToCart() {
    setLoadingCart(true);

    try {
      const success = await addToCart(1);

      if (success) {
        toast.success("Produk berhasil masuk keranjang.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menambahkan keranjang.",
      );
    } finally {
      setLoadingCart(false);
    }
  }

  async function handleBuyNow() {
    setLoadingBuy(true);

    try {
      const success = await addToCart(1);

      if (success) {
        window.location.href = `/checkout?buy_now=${productId}`;
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memproses beli sekarang.",
      );
    } finally {
      setLoadingBuy(false);
    }
  }

  async function handleWishlist() {
    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli terlebih dahulu.");
      window.location.href = "/login/pembeli";
      return;
    }

    if (!isBuyer) {
      toast.error("Wishlist hanya tersedia untuk pembeli.");
      return;
    }

    if (!productId) {
      toast.error("ID produk tidak valid.");
      return;
    }

    setLoadingWishlist(true);

    try {
      const existing = await findWishlistItem({
        buyerId: user.id,
        productId,
      });

      if (existing?.id) {
        await deleteWishlistItem({
          wishlistId: existing.id,
          buyerId: user.id,
        });

        setWishlisted(false);
        toast.success("Produk dihapus dari wishlist.");
      } else {
        await insertWishlistItem({
          buyerId: user.id,
          productId,
        });

        setWishlisted(true);
        toast.success("Produk ditambahkan ke wishlist.");
      }

      window.dispatchEvent(new Event("wishlist-updated"));
      onWishlistUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui wishlist.",
      );
    } finally {
      setLoadingWishlist(false);
    }
  }

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className="relative">
        <a href={detailUrl} className="block aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Tidak ada foto
            </div>
          )}
        </a>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {discountPercent > 0 ? (
            <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}

          {!isAvailable ? (
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
              {stock <= 0 ? "Stok Habis" : productStatusLabel(status)}
            </span>
          ) : null}

          {condition ? (
            <span className="rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm backdrop-blur">
              {conditionLabel(condition)}
            </span>
          ) : null}
        </div>

        {showWishlist ? (
          <button
            type="button"
            onClick={handleWishlist}
            disabled={loadingWishlist}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm backdrop-blur transition hover:bg-background ${wishlisted ? "text-destructive" : "text-foreground"
              }`}
            aria-label={wishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
            title={wishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
          >
            {loadingWishlist ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`}
              />
            )}
          </button>
        ) : null}
      </div>

      <div className={compact ? "p-3" : "p-4"}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {categoryName ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1">
              <Tag className="h-3 w-3" />
              {categoryName}
            </span>
          ) : null}

          {isApproved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-green-700">
              <Sparkles className="h-3 w-3" />
              Aktif
            </span>
          ) : null}
        </div>

        <a href={detailUrl}>
          <h3
            className={`mt-3 line-clamp-2 font-semibold transition hover:text-primary ${compact ? "min-h-10 text-sm" : "min-h-12"
              }`}
          >
            {title}
          </h3>
        </a>

        <div className="mt-2">
          <ProductRatingInline
            productId={productId}
            averageRating={product?.average_rating}
            reviewCount={product?.review_count}
          />
        </div>

        {!compact && description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-3">
          <div className={compact ? "font-bold text-primary" : "text-lg font-bold text-primary"}>
            {formatIDR(price)}
          </div>

          {originalPrice > price ? (
            <div className="text-sm text-muted-foreground line-through">
              {formatIDR(originalPrice)}
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
          {location ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{location}</span>
            </div>
          ) : null}

          {showSeller && sellerName ? (
            <div className="flex items-center gap-1">
              <Store className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{sellerName}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              Stok {stock}
            </span>

            <span>Terjual {sold}</span>
          </div>
        </div>

        {showActions ? (
          <div className="mt-4 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!isAvailable || loadingCart}
                onClick={handleAddToCart}
                className="w-full"
              >
                {loadingCart ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                Keranjang
              </Button>

              <Button
                type="button"
                disabled={!isAvailable || loadingBuy}
                onClick={handleBuyNow}
                className="w-full gradient-brand text-white"
              >
                {loadingBuy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Beli
              </Button>
            </div>

            <Button asChild type="button" variant="ghost" className="w-full">
              <a href={detailUrl}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default ProductCard;

async function findWishlistItem({
  buyerId,
  productId,
}: {
  buyerId: string;
  productId: string;
}) {
  const firstAttempt = await db
    .from("wishlists")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!firstAttempt.error) {
    return firstAttempt.data;
  }

  const secondAttempt = await db
    .from("wishlist_items")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!secondAttempt.error) {
    return secondAttempt.data;
  }

  return null;
}

async function insertWishlistItem({
  buyerId,
  productId,
}: {
  buyerId: string;
  productId: string;
}) {
  const payload = {
    buyer_id: buyerId,
    product_id: productId,
    created_at: new Date().toISOString(),
  };

  const firstAttempt = await db.from("wishlists").insert(payload).select("id").single();

  if (!firstAttempt.error) {
    return firstAttempt.data;
  }

  const secondAttempt = await db
    .from("wishlist_items")
    .insert(payload)
    .select("id")
    .single();

  if (!secondAttempt.error) {
    return secondAttempt.data;
  }

  throw new Error(firstAttempt.error.message || secondAttempt.error.message);
}

async function deleteWishlistItem({
  wishlistId,
  buyerId,
}: {
  wishlistId: string;
  buyerId: string;
}) {
  const firstAttempt = await db
    .from("wishlists")
    .delete()
    .eq("id", wishlistId)
    .eq("buyer_id", buyerId);

  if (!firstAttempt.error) return;

  const secondAttempt = await db
    .from("wishlist_items")
    .delete()
    .eq("id", wishlistId)
    .eq("buyer_id", buyerId);

  if (!secondAttempt.error) return;

  throw new Error(firstAttempt.error.message || secondAttempt.error.message);
}

function getCategoryName(product: ProductLike) {
  const category = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;

  return String(category?.name ?? product.category_name ?? "");
}

function getSellerName(product: ProductLike) {
  const sellerFromProfiles = Array.isArray(product.profiles)
    ? product.profiles[0]
    : product.profiles;

  const seller = product.seller ?? sellerFromProfiles;

  return String(
    seller?.shop_name ??
    seller?.full_name ??
    product.shop_name ??
    product.seller_name ??
    "",
  );
}

function productStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Aktif",
    active: "Aktif",
    rejected: "Ditolak",
    inactive: "Nonaktif",
    sold_out: "Stok Habis",
  };

  return labels[String(status ?? "")] ?? status ?? "-";
}

function conditionLabel(condition: string | null) {
  const labels: Record<string, string> = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup",
  };

  return labels[String(condition ?? "")] ?? condition ?? "-";
}

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}