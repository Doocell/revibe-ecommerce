import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  ShoppingCart,
  Star,
  Store,
  UserRound,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  addProductToCart,
  checkWishlistStatus,
  toggleProductWishlist,
} from "@/lib/buyer-product-actions";

const db = supabase as any;

export const Route = createFileRoute("/produk/$id")({
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
  stock: number | string | null;
  sold: number | string | null;
  images: string[] | null;
  status: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type SellerRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  shop_name: string | null;
  shop_location: string | null;
  shop_logo_url: string | null;
};

type ReviewRow = {
  id: string;
  rating: number | string;
  comment: string | null;
  created_at: string | null;
};

function ProductDetailPage() {
  const params = Route.useParams();
  const { user } = useAuth();

  const productId = String(params.id ?? "").trim();

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [cartLoading, setCartLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  async function loadDetail() {
    if (!productId || productId === "undefined") {
      toast.error("ID produk tidak valid.");
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
        setLoading(false);
        return;
      }

      const safeProduct = productData as ProductRow;
      setProduct(safeProduct);

      const images = Array.isArray(safeProduct.images)
        ? safeProduct.images.filter(Boolean)
        : [];

      setSelectedImage(images[0] ?? "");

      if (safeProduct.category_id) {
        const { data: categoryData } = await db
          .from("categories")
          .select("id, name")
          .eq("id", safeProduct.category_id)
          .maybeSingle();

        setCategory((categoryData ?? null) as CategoryRow | null);
      }

      if (safeProduct.seller_id) {
        const { data: sellerData } = await db
          .from("profiles")
          .select(
            "id, full_name, avatar_url, city, shop_name, shop_location, shop_logo_url",
          )
          .eq("id", safeProduct.seller_id)
          .maybeSingle();

        setSeller((sellerData ?? null) as SellerRow | null);
      }

      try {
        const { data: reviewData } = await db
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("product_id", safeProduct.id)
          .order("created_at", { ascending: false });

        setReviews((reviewData ?? []) as ReviewRow[]);
      } catch {
        setReviews([]);
      }

      if (user?.id) {
        const wishlistStatus = await checkWishlistStatus({
          buyerId: user.id,
          productId: safeProduct.id,
        });

        setIsWishlisted(wishlistStatus);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuka detail produk.",
      );
      console.error("[Product Detail Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [productId, user?.id]);

  const images = useMemo(() => {
    if (!Array.isArray(product?.images)) return [];
    return product.images.filter(Boolean);
  }, [product?.images]);

  const price = Number(product?.price ?? 0);
  const originalPrice = Number(product?.original_price ?? 0);
  const stock = Number(product?.stock ?? 0);
  const sold = Number(product?.sold ?? 0);
  const status = String(product?.status ?? "approved");
  const sellerId = String(product?.seller_id ?? "");
  const isSellerOwner = Boolean(user?.id && sellerId && user.id === sellerId);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => {
      return sum + Number(review.rating ?? 0);
    }, 0);

    return total / reviews.length;
  }, [reviews]);

  const discount = useMemo(() => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }, [originalPrice, price]);

  const canBuy = Boolean(product) && status === "approved" && stock > 0 && !isSellerOwner;

  function validateBuyerAction() {
    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli terlebih dahulu.");
      window.location.href = "/login/pembeli";
      return false;
    }

    if (!product) {
      toast.error("Produk tidak ditemukan.");
      return false;
    }

    if (isSellerOwner) {
      toast.error("Seller tidak bisa membeli produknya sendiri.");
      return false;
    }

    if (status !== "approved") {
      toast.error("Produk belum tersedia untuk dibeli.");
      return false;
    }

    if (stock <= 0) {
      toast.error("Stok produk habis.");
      return false;
    }

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > stock) {
      toast.error("Jumlah produk tidak valid.");
      return false;
    }

    return true;
  }

  async function handleAddCart() {
    if (!validateBuyerAction()) return;

    setCartLoading(true);

    try {
      await addProductToCart({
        buyerId: user!.id,
        productId,
        quantity,
      });

      toast.success("Produk berhasil masuk keranjang.");
      window.location.href = "/keranjang";
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menambahkan produk ke keranjang.",
      );
    } finally {
      setCartLoading(false);
    }
  }

  async function handleBuyNow() {
    if (!validateBuyerAction()) return;

    setBuyLoading(true);

    try {
      await addProductToCart({
        buyerId: user!.id,
        productId,
        quantity,
      });

      toast.success("Produk siap di-checkout.");
      window.location.href = `/checkout?buy_now=${productId}`;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memproses beli langsung.",
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

    if (!product) return;

    setWishlistLoading(true);

    try {
      const nextStatus = await toggleProductWishlist({
        buyerId: user.id,
        productId: product.id,
        currentStatus: isWishlisted,
      });

      setIsWishlisted(nextStatus);

      toast.success(
        nextStatus
          ? "Produk ditambahkan ke wishlist."
          : "Produk dihapus dari wishlist.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah wishlist.",
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Store className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-xl font-semibold">
                Produk tidak ditemukan
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Produk mungkin sudah dihapus atau belum tersedia.
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <Button asChild variant="ghost" className="mb-6">
            <a href="/produk">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Produk
            </a>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-square bg-muted">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      Tidak ada foto produk
                    </div>
                  )}
                </div>
              </div>

              {images.length > 1 ? (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {images.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`aspect-square overflow-hidden rounded-2xl border ${selectedImage === image
                          ? "border-primary"
                          : "border-border"
                        }`}
                    >
                      <img
                        src={image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    {category?.name ?? "Produk"}
                  </span>

                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                    {conditionLabel(product.condition)}
                  </span>

                  {status !== "approved" ? (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                      Belum tersedia
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 text-3xl font-bold">{product.title}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {product.location || "-"}
                  </span>

                  <span>Stok: {stock}</span>
                  <span>{sold} terjual</span>
                </div>

                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${index < Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-yellow-400"
                        }`}
                    />
                  ))}

                  <span className="ml-2 text-sm text-muted-foreground">
                    {reviews.length > 0
                      ? `${averageRating.toFixed(1)} (${reviews.length} ulasan)`
                      : "Belum ada ulasan"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <div className="text-3xl font-bold text-primary">
                    {formatIDR(price)}
                  </div>

                  {originalPrice > price ? (
                    <>
                      <div className="text-sm text-muted-foreground line-through">
                        {formatIDR(originalPrice)}
                      </div>

                      {discount > 0 ? (
                        <div className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                          -{discount}%
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <h2 className="font-semibold">Deskripsi Produk</h2>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {product.description || "Tidak ada deskripsi produk."}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-semibold">Atur Pembelian</h2>

                <div className="mt-4 grid gap-2">
                  <label className="text-sm font-medium">Jumlah</label>

                  <Input
                    type="number"
                    min={1}
                    max={stock}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value || 1))
                    }
                  />

                  <div className="text-xs text-muted-foreground">
                    Stok tersedia: {stock}
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    {formatIDR(price * quantity)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                  <Button
                    type="button"
                    disabled={!canBuy || cartLoading}
                    onClick={handleAddCart}
                    variant="outline"
                    className="w-full"
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
                    variant="outline"
                    size="icon"
                    disabled={wishlistLoading}
                    onClick={handleWishlist}
                    className={isWishlisted ? "text-red-500" : ""}
                  >
                    <Heart
                      className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""
                        }`}
                    />
                  </Button>
                </div>

                <Button
                  type="button"
                  disabled={!canBuy || buyLoading}
                  onClick={handleBuyNow}
                  className="mt-3 w-full gradient-brand text-white"
                >
                  {buyLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Beli Sekarang
                </Button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-semibold">Informasi Penjual</h2>

                <div className="mt-4 flex items-start gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-primary/10 text-primary">
                    {seller?.shop_logo_url || seller?.avatar_url ? (
                      <img
                        src={seller.shop_logo_url || seller.avatar_url || ""}
                        alt={seller.shop_name || seller.full_name || "Seller"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold">
                      {seller?.shop_name ||
                        seller?.full_name ||
                        "Seller ReVibe"}
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {seller?.shop_location || seller?.city || "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <Button asChild variant="outline">
                    <a href={`/toko/${sellerId}`}>
                      <Store className="mr-2 h-4 w-4" />
                      Lihat Toko
                    </a>
                  </Button>

                  <Button asChild variant="outline">
                    <a href={`/chat?product_id=${product.id}&seller_id=${sellerId}`}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat Penjual
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Ulasan Pembeli</h2>

            <div className="mt-5">
              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Belum ada ulasan untuk produk ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${index < Number(review.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-yellow-400"
                              }`}
                          />
                        ))}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {review.comment || "Tidak ada komentar."}
                      </p>

                      {review.created_at ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleString("id-ID")}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
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