import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  ProductRatingInline,
  ProductReviewSection,
} from "@/components/ProductRating";

const db = supabase as any;

export const Route = createFileRoute("/detail-produk")({
  component: ProductDetailPage,
});

type ProductRow = {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number | string;
  original_price: number | string | null;
  condition: string | null;
  location: string | null;
  stock: number | string;
  sold: number | string | null;
  images: string[] | null;
  image_url?: string | null;
  status: string | null;
  average_rating?: number | string | null;
  review_count?: number | string | null;
  created_at: string;
  updated_at: string | null;
  categories?: CategoryRow | CategoryRow[] | null;
  profiles?: SellerProfile | SellerProfile[] | null;
};

type SellerProfile = {
  id: string;
  full_name: string | null;
  shop_name: string | null;
  shop_location: string | null;
  shop_description: string | null;
  shop_logo_url: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  city: string | null;
  bio: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
};

function ProductDetailPage() {
  const { user, roles } = useAuth();

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductRow[]>([]);

  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const productId = useMemo(() => {
    if (typeof window === "undefined") return "";

    const params = new URLSearchParams(window.location.search);

    return params.get("id") ?? params.get("product") ?? "";
  }, []);

  const safeRoles = roles ?? [];
  const isBuyer = safeRoles.includes("buyer");

  async function loadProduct() {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: productData, error: productError } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (productError) {
        throw new Error(productError.message);
      }

      if (!productData) {
        setProduct(null);
        return;
      }

      const currentProduct = productData as ProductRow;

      setProduct(currentProduct);

      const images = getProductImages(currentProduct);
      setSelectedImage(images[0] ?? "");

      const sellerId = currentProduct.seller_id;
      const categoryId = currentProduct.category_id;

      const [sellerResult, categoryResult, relatedResult] = await Promise.all([
        sellerId
          ? db
            .from("profiles")
            .select(
              "id, full_name, shop_name, shop_location, shop_description, shop_logo_url, avatar_url, whatsapp, city, bio",
            )
            .eq("id", sellerId)
            .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        categoryId
          ? db
            .from("categories")
            .select("id, name, slug")
            .eq("id", categoryId)
            .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        categoryId
          ? db
            .from("products")
            .select(
              `
                *,
                categories(id, name, slug)
              `,
            )
            .eq("category_id", categoryId)
            .eq("status", "approved")
            .neq("id", productId)
            .order("created_at", { ascending: false })
            .limit(4)
          : db
            .from("products")
            .select(
              `
                *,
                categories(id, name, slug)
              `,
            )
            .eq("status", "approved")
            .neq("id", productId)
            .order("created_at", { ascending: false })
            .limit(4),
      ]);

      if (sellerResult.error) {
        console.error("[Detail Product Seller Error]", sellerResult.error);
      }

      if (categoryResult.error) {
        console.error("[Detail Product Category Error]", categoryResult.error);
      }

      if (relatedResult.error) {
        console.error("[Detail Product Related Error]", relatedResult.error);
      }

      setSeller((sellerResult.data ?? null) as SellerProfile | null);
      setCategory((categoryResult.data ?? null) as CategoryRow | null);
      setRelatedProducts((relatedResult.data ?? []) as ProductRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat detail produk.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadWishlistStatus() {
    if (!user?.id || !productId || !isBuyer) {
      setWishlisted(false);
      return;
    }

    try {
      const item = await findWishlistItem({
        buyerId: user.id,
        productId,
      });

      setWishlisted(Boolean(item?.id));
    } catch (error) {
      console.error("[Detail Product Wishlist Status Error]", error);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    loadWishlistStatus();
  }, [user?.id, productId, isBuyer]);

  async function ensureBuyerCanBuy() {
    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli terlebih dahulu.");
      window.location.href = "/login/pembeli";
      return false;
    }

    if (!isBuyer) {
      toast.error("Fitur pembelian hanya untuk akun pembeli.");
      return false;
    }

    if (!product) {
      toast.error("Produk tidak ditemukan.");
      return false;
    }

    if (!product.id) {
      toast.error("ID produk tidak valid.");
      return false;
    }

    if (!isProductApproved(product)) {
      toast.error("Produk belum aktif.");
      return false;
    }

    if (getProductStock(product) <= 0) {
      toast.error("Stok produk habis.");
      return false;
    }

    if (quantity < 1 || quantity > getProductStock(product)) {
      toast.error("Jumlah produk tidak valid.");
      return false;
    }

    return true;
  }

  async function addToCart() {
    const canContinue = await ensureBuyerCanBuy();

    if (!canContinue || !product || !user?.id) return false;

    const stock = getProductStock(product);

    const { data: existingItem, error: existingError } = await db
      .from("cart_items")
      .select("id, quantity")
      .eq("buyer_id", user.id)
      .eq("product_id", product.id)
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
        product_id: product.id,
        quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    window.dispatchEvent(new Event("cart-updated"));

    return true;
  }

  async function handleAddToCart() {
    setCartLoading(true);

    try {
      const success = await addToCart();

      if (success) {
        toast.success("Produk berhasil masuk keranjang.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menambahkan keranjang.",
      );
    } finally {
      setCartLoading(false);
    }
  }

  async function handleBuyNow() {
    setBuyLoading(true);

    try {
      const success = await addToCart();

      if (success && product) {
        window.location.href = `/checkout?buy_now=${product.id}`;
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memproses beli sekarang.",
      );
    } finally {
      setBuyLoading(false);
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

    if (!product?.id) {
      toast.error("ID produk tidak valid.");
      return;
    }

    setWishlistLoading(true);

    try {
      const existing = await findWishlistItem({
        buyerId: user.id,
        productId: product.id,
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
          productId: product.id,
        });

        setWishlisted(true);
        toast.success("Produk ditambahkan ke wishlist.");
      }

      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui wishlist.",
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto flex min-h-96 items-center justify-center px-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-10 text-center">
              <Package className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">
                Produk tidak ditemukan
              </h1>

              <p className="mt-2 text-muted-foreground">
                Produk mungkin sudah dihapus atau tidak tersedia.
              </p>

              <Button asChild className="mt-6 gradient-brand text-white">
                <a href="/produk">Kembali ke Produk</a>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  const images = getProductImages(product);
  const price = Number(product.price ?? 0);
  const originalPrice = Number(product.original_price ?? 0);
  const stock = getProductStock(product);
  const sold = Number(product.sold ?? 0);
  const isAvailable = isProductApproved(product) && stock > 0;
  const discountPercent =
    originalPrice > price && price > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="overflow-hidden rounded-3xl border border-border bg-muted">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-muted-foreground">
                    Tidak ada foto
                  </div>
                )}
              </div>

              {images.length > 1 ? (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-xl border transition ${selectedImage === image
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${isProductApproved(product)
                        ? "bg-green-100 text-green-700"
                        : "bg-primary/10 text-primary"
                      }`}
                  >
                    {productStatusLabel(product.status)}
                  </span>

                  {category ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      <Tag className="h-3 w-3" />
                      {category.name}
                    </span>
                  ) : null}

                  {discountPercent > 0 ? (
                    <span className="rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground">
                      Diskon {discountPercent}%
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 text-3xl font-bold">{product.title}</h1>

                <div className="mt-3">
                  <ProductRatingInline
                    productId={product.id}
                    averageRating={product.average_rating}
                    reviewCount={product.review_count}
                  />
                </div>

                <div className="mt-5">
                  <div className="text-3xl font-bold text-primary">
                    {formatIDR(price)}
                  </div>

                  {originalPrice > price ? (
                    <div className="mt-1 text-muted-foreground line-through">
                      {formatIDR(originalPrice)}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl bg-accent p-4 text-sm md:grid-cols-2">
                  <Info
                    icon={<Package className="h-4 w-4" />}
                    label="Stok"
                    value={`${stock} tersedia`}
                  />

                  <Info
                    icon={<Truck className="h-4 w-4" />}
                    label="Terjual"
                    value={`${sold} produk`}
                  />

                  <Info
                    icon={<MapPin className="h-4 w-4" />}
                    label="Lokasi"
                    value={product.location || "-"}
                  />

                  <Info
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Kondisi"
                    value={conditionLabel(product.condition)}
                  />
                </div>

                <div className="mt-6">
                  <h2 className="font-semibold">Deskripsi Produk</h2>

                  <p className="mt-2 whitespace-pre-line leading-7 text-muted-foreground">
                    {product.description || "Tidak ada deskripsi."}
                  </p>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium">Jumlah</label>

                  <div className="mt-2 flex w-fit items-center rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                      className="px-4 py-2 text-lg"
                    >
                      -
                    </button>

                    <div className="min-w-12 px-4 py-2 text-center">
                      {quantity}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.min(stock, current + 1))
                      }
                      className="px-4 py-2 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isAvailable || cartLoading}
                    onClick={handleAddToCart}
                  >
                    {cartLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    Keranjang
                  </Button>

                  <Button
                    type="button"
                    disabled={!isAvailable || buyLoading}
                    onClick={handleBuyNow}
                    className="gradient-brand text-white"
                  >
                    {buyLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Beli Sekarang
                  </Button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={wishlistLoading}
                    onClick={handleWishlist}
                  >
                    {wishlistLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Heart
                        className={`mr-2 h-4 w-4 ${wishlisted ? "fill-current text-destructive" : ""
                          }`}
                      />
                    )}
                    {wishlisted ? "Hapus Wishlist" : "Wishlist"}
                  </Button>

                  <Button asChild variant="outline">
                    <a href={buildChatUrl(product, seller)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat Seller
                    </a>
                  </Button>
                </div>

                {!isAvailable ? (
                  <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Produk belum bisa dibeli karena belum aktif atau stok habis.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 rounded-3xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Informasi Toko</h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Detail seller produk ini.
                    </p>
                  </div>

                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>

                <div className="mt-4 flex gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {seller?.shop_logo_url || seller?.avatar_url ? (
                      <img
                        src={seller.shop_logo_url ?? seller.avatar_url ?? ""}
                        alt={seller.shop_name ?? seller.full_name ?? "Toko"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Toko
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold">
                      {seller?.shop_name || seller?.full_name || "Seller"}
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {seller?.shop_location ||
                        seller?.city ||
                        product.location ||
                        "-"}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {seller?.shop_description ||
                        seller?.bio ||
                        "Seller ReVibe yang menjual produk preloved."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a href={buildChatUrl(product, seller)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Hubungi Seller
                    </a>
                  </Button>

                  <Button asChild variant="outline">
                    <a href="/produk">
                      <Store className="mr-2 h-4 w-4" />
                      Lanjut Belanja
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <ProductReviewSection productId={product.id} />

          {relatedProducts.length > 0 ? (
            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Produk Serupa</h2>

                  <p className="mt-1 text-muted-foreground">
                    Produk lain yang mungkin kamu suka.
                  </p>
                </div>

                <Button asChild variant="outline">
                  <a href="/produk">Lihat Semua Produk</a>
                </Button>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-background p-2 text-primary">{icon}</div>

      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

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

  const thirdAttempt = await db
    .from("wishlists")
    .select("id")
    .eq("user_id", buyerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!thirdAttempt.error) {
    return thirdAttempt.data;
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
  const buyerPayload = {
    buyer_id: buyerId,
    product_id: productId,
    created_at: new Date().toISOString(),
  };

  const firstAttempt = await db
    .from("wishlists")
    .insert(buyerPayload)
    .select("id")
    .single();

  if (!firstAttempt.error) {
    return firstAttempt.data;
  }

  const secondAttempt = await db
    .from("wishlist_items")
    .insert(buyerPayload)
    .select("id")
    .single();

  if (!secondAttempt.error) {
    return secondAttempt.data;
  }

  const userPayload = {
    user_id: buyerId,
    product_id: productId,
    created_at: new Date().toISOString(),
  };

  const thirdAttempt = await db
    .from("wishlists")
    .insert(userPayload)
    .select("id")
    .single();

  if (!thirdAttempt.error) {
    return thirdAttempt.data;
  }

  throw new Error(
    firstAttempt.error.message ||
    secondAttempt.error.message ||
    thirdAttempt.error.message,
  );
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

  const thirdAttempt = await db
    .from("wishlists")
    .delete()
    .eq("id", wishlistId)
    .eq("user_id", buyerId);

  if (!thirdAttempt.error) return;

  throw new Error(
    firstAttempt.error.message ||
    secondAttempt.error.message ||
    thirdAttempt.error.message,
  );
}

function getProductImages(product: ProductRow) {
  if (Array.isArray(product.images)) {
    return product.images.filter(Boolean);
  }

  if (product.image_url) {
    return [String(product.image_url)];
  }

  return [];
}

function getProductStock(product: ProductRow) {
  return Number(product.stock ?? 0);
}

function isProductApproved(product: ProductRow) {
  const status = String(product.status ?? "");

  return status === "approved" || status === "active";
}

function buildChatUrl(product: ProductRow, seller: SellerProfile | null) {
  const sellerId = seller?.id ?? product.seller_id;

  if (!sellerId) return "/chat";

  return `/chat?seller=${sellerId}&product=${product.id}`;
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