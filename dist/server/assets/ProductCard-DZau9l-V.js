import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Star, Loader2, Heart, Tag, Sparkles, MapPin, Store, Package, ShoppingCart, Zap, Eye } from "lucide-react";
import { u as useAuth, B as Button, s as supabase } from "./Navbar-BfYtpR_3.js";
import { g as getProductReviewSummary, a as getProductReviews } from "./reviews-CeiujS0R.js";
function ProductRatingInline({
  productId,
  averageRating,
  reviewCount
}) {
  const [summary, setSummary] = useState({
    averageRating: Number(averageRating ?? 0),
    reviewCount: Number(reviewCount ?? 0)
  });
  useEffect(() => {
    let active = true;
    async function loadSummary() {
      if (!productId) return;
      const result = await getProductReviewSummary(productId);
      if (active) {
        setSummary(result);
      }
    }
    loadSummary();
    return () => {
      active = false;
    };
  }, [productId]);
  const safeAverage = Number(summary.averageRating ?? 0);
  const safeCount = Number(summary.reviewCount ?? 0);
  const roundedAverage = Math.round(safeAverage);
  if (safeCount <= 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1 text-sm text-muted-foreground", children: [
      [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsx(Star, { className: "h-4 w-4" }, star)),
      /* @__PURE__ */ jsx("span", { className: "ml-1", children: "Belum ada ulasan" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1 text-sm", children: [
    [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsx(
      Star,
      {
        className: `h-4 w-4 ${star <= roundedAverage ? "fill-current text-yellow-500" : "text-muted-foreground"}`
      },
      star
    )),
    /* @__PURE__ */ jsxs("span", { className: "ml-1 text-muted-foreground", children: [
      safeAverage.toFixed(1),
      " (",
      safeCount,
      " ulasan)"
    ] })
  ] });
}
function StaticRating({ rating }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating ?? 0)));
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm", children: [
    [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsx(
      Star,
      {
        className: `h-4 w-4 ${star <= safeRating ? "fill-current text-yellow-500" : "text-muted-foreground"}`
      },
      star
    )),
    /* @__PURE__ */ jsxs("span", { className: "ml-1 text-muted-foreground", children: [
      safeRating.toFixed(0),
      "/5"
    ] })
  ] });
}
function ProductReviewSection({ productId }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    averageRating: 0,
    reviewCount: 0
  });
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    let active = true;
    async function loadReviews() {
      if (!productId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [summaryResult, reviewRows] = await Promise.all([
          getProductReviewSummary(productId),
          getProductReviews(productId)
        ]);
        if (!active) return;
        setSummary(summaryResult);
        setReviews(reviewRows);
      } catch (error) {
        console.error("[Product Review Section Error]", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadReviews();
    return () => {
      active = false;
    };
  }, [productId]);
  return /* @__PURE__ */ jsxs("section", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Ulasan Produk" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Rating dan komentar dari pembeli yang sudah menyelesaikan pesanan." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-primary/10 px-4 py-3 text-primary", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: Number(summary.averageRating ?? 0).toFixed(1) }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
          summary.reviewCount,
          " ulasan"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
      ProductRatingInline,
      {
        productId,
        averageRating: summary.averageRating,
        reviewCount: summary.reviewCount
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "Memuat ulasan..." }) : reviews.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "Produk ini belum memiliki ulasan." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: reviews.map((review) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "rounded-xl border border-border bg-background p-4",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsx(StaticRating, { rating: review.rating }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(review.created_at).toLocaleString("id-ID") })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-muted-foreground", children: review.comment || "Pembeli tidak menulis komentar." })
        ]
      },
      review.id
    )) }) })
  ] });
}
const db = supabase;
function ProductCard({
  product,
  className = "",
  compact = false,
  showActions = true,
  showWishlist = true,
  showSeller = true,
  onCartUpdated,
  onWishlistUpdated
}) {
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
  const discountPercent = originalPrice > price && price > 0 ? Math.round((originalPrice - price) / originalPrice * 100) : 0;
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
        productId
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
    const { data: existingItem, error: existingError } = await db.from("cart_items").select("id, quantity").eq("buyer_id", user.id).eq("product_id", productId).maybeSingle();
    if (existingError) {
      throw new Error(existingError.message);
    }
    if (existingItem?.id) {
      const currentQuantity = Number(existingItem.quantity ?? 0);
      const nextQuantity = currentQuantity + quantity;
      if (nextQuantity > stock) {
        throw new Error("Jumlah produk di keranjang melebihi stok.");
      }
      const { error } = await db.from("cart_items").update({
        quantity: nextQuantity,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", existingItem.id).eq("buyer_id", user.id);
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
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
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
        error instanceof Error ? error.message : "Gagal menambahkan keranjang."
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
        error instanceof Error ? error.message : "Gagal memproses beli sekarang."
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
        productId
      });
      if (existing?.id) {
        await deleteWishlistItem({
          wishlistId: existing.id,
          buyerId: user.id
        });
        setWishlisted(false);
        toast.success("Produk dihapus dari wishlist.");
      } else {
        await insertWishlistItem({
          buyerId: user.id,
          productId
        });
        setWishlisted(true);
        toast.success("Produk ditambahkan ke wishlist.");
      }
      window.dispatchEvent(new Event("wishlist-updated"));
      onWishlistUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui wishlist."
      );
    } finally {
      setLoadingWishlist(false);
    }
  }
  return /* @__PURE__ */ jsxs(
    "article",
    {
      className: `group overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:-translate-y-1 hover:shadow-lg ${className}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("a", { href: detailUrl, className: "block aspect-square overflow-hidden bg-muted", children: image ? /* @__PURE__ */ jsx(
            "img",
            {
              src: image,
              alt: title,
              className: "h-full w-full object-cover transition duration-300 group-hover:scale-105",
              loading: "lazy"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-sm text-muted-foreground", children: "Tidak ada foto" }) }),
          /* @__PURE__ */ jsxs("div", { className: "absolute left-3 top-3 flex flex-wrap gap-2", children: [
            discountPercent > 0 ? /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow-sm", children: [
              "-",
              discountPercent,
              "%"
            ] }) : null,
            !isAvailable ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur", children: stock <= 0 ? "Stok Habis" : productStatusLabel(status) }) : null,
            condition ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm backdrop-blur", children: conditionLabel(condition) }) : null
          ] }),
          showWishlist ? /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleWishlist,
              disabled: loadingWishlist,
              className: `absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm backdrop-blur transition hover:bg-background ${wishlisted ? "text-destructive" : "text-foreground"}`,
              "aria-label": wishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist",
              title: wishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist",
              children: loadingWishlist ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(
                Heart,
                {
                  className: `h-4 w-4 ${wishlisted ? "fill-current" : ""}`
                }
              )
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: compact ? "p-3" : "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [
            categoryName ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1", children: [
              /* @__PURE__ */ jsx(Tag, { className: "h-3 w-3" }),
              categoryName
            ] }) : null,
            isApproved ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-green-700", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
              "Aktif"
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx("a", { href: detailUrl, children: /* @__PURE__ */ jsx(
            "h3",
            {
              className: `mt-3 line-clamp-2 font-semibold transition hover:text-primary ${compact ? "min-h-10 text-sm" : "min-h-12"}`,
              children: title
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
            ProductRatingInline,
            {
              productId,
              averageRating: product?.average_rating,
              reviewCount: product?.review_count
            }
          ) }),
          !compact && description ? /* @__PURE__ */ jsx("p", { className: "mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground", children: description }) : null,
          /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsx("div", { className: compact ? "font-bold text-primary" : "text-lg font-bold text-primary", children: formatIDR(price) }),
            originalPrice > price ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground line-through", children: formatIDR(originalPrice) }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-1 text-xs text-muted-foreground", children: [
            location ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "line-clamp-1", children: location })
            ] }) : null,
            showSeller && sellerName ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Store, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "line-clamp-1", children: sellerName })
            ] }) : null,
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Package, { className: "h-3.5 w-3.5" }),
                "Stok ",
                stock
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Terjual ",
                sold
              ] })
            ] })
          ] }),
          showActions ? /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  disabled: !isAvailable || loadingCart,
                  onClick: handleAddToCart,
                  className: "w-full",
                  children: [
                    loadingCart ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(ShoppingCart, { className: "mr-2 h-4 w-4" }),
                    "Keranjang"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  disabled: !isAvailable || loadingBuy,
                  onClick: handleBuyNow,
                  className: "w-full gradient-brand text-white",
                  children: [
                    loadingBuy ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Zap, { className: "mr-2 h-4 w-4" }),
                    "Beli"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx(Button, { asChild: true, type: "button", variant: "ghost", className: "w-full", children: /* @__PURE__ */ jsxs("a", { href: detailUrl, children: [
              /* @__PURE__ */ jsx(Eye, { className: "mr-2 h-4 w-4" }),
              "Lihat Detail"
            ] }) })
          ] }) : null
        ] })
      ]
    }
  );
}
async function findWishlistItem({
  buyerId,
  productId
}) {
  const firstAttempt = await db.from("wishlists").select("id").eq("buyer_id", buyerId).eq("product_id", productId).maybeSingle();
  if (!firstAttempt.error) {
    return firstAttempt.data;
  }
  const secondAttempt = await db.from("wishlist_items").select("id").eq("buyer_id", buyerId).eq("product_id", productId).maybeSingle();
  if (!secondAttempt.error) {
    return secondAttempt.data;
  }
  return null;
}
async function insertWishlistItem({
  buyerId,
  productId
}) {
  const payload = {
    buyer_id: buyerId,
    product_id: productId,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const firstAttempt = await db.from("wishlists").insert(payload).select("id").single();
  if (!firstAttempt.error) {
    return firstAttempt.data;
  }
  const secondAttempt = await db.from("wishlist_items").insert(payload).select("id").single();
  if (!secondAttempt.error) {
    return secondAttempt.data;
  }
  throw new Error(firstAttempt.error.message || secondAttempt.error.message);
}
async function deleteWishlistItem({
  wishlistId,
  buyerId
}) {
  const firstAttempt = await db.from("wishlists").delete().eq("id", wishlistId).eq("buyer_id", buyerId);
  if (!firstAttempt.error) return;
  const secondAttempt = await db.from("wishlist_items").delete().eq("id", wishlistId).eq("buyer_id", buyerId);
  if (!secondAttempt.error) return;
  throw new Error(firstAttempt.error.message || secondAttempt.error.message);
}
function getCategoryName(product) {
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  return String(category?.name ?? product.category_name ?? "");
}
function getSellerName(product) {
  const sellerFromProfiles = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
  const seller = product.seller ?? sellerFromProfiles;
  return String(
    seller?.shop_name ?? seller?.full_name ?? product.shop_name ?? product.seller_name ?? ""
  );
}
function productStatusLabel(status) {
  const labels = {
    pending: "Menunggu Verifikasi",
    approved: "Aktif",
    active: "Aktif",
    rejected: "Ditolak",
    inactive: "Nonaktif",
    sold_out: "Stok Habis"
  };
  return labels[String(status ?? "")] ?? status ?? "-";
}
function conditionLabel(condition) {
  const labels = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup"
  };
  return labels[String(condition ?? "")] ?? condition ?? "-";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
export {
  ProductCard as P,
  ProductRatingInline as a,
  ProductReviewSection as b
};
