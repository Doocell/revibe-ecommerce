import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Store, ArrowLeft, MapPin, Star, ShoppingCart, Heart, Zap, UserRound, MessageCircle } from "lucide-react";
import { s as supabase, u as useAuth, N as Navbar, F as Footer, B as Button } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { a as Route } from "./router-CwyNLJRw.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@tanstack/react-query";
const db$1 = supabase;
async function addProductToCart({
  buyerId,
  productId,
  quantity = 1
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
  const { data: product, error: productError } = await db$1.from("products").select("id, seller_id, title, stock, status").eq("id", cleanProductId).maybeSingle();
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
  const { data: existingCart, error: findError } = await db$1.from("cart_items").select("id, quantity").eq("buyer_id", cleanBuyerId).eq("product_id", cleanProductId).maybeSingle();
  if (findError) {
    throw new Error(findError.message);
  }
  const nextQuantity = existingCart ? Number(existingCart.quantity ?? 0) + cleanQuantity : cleanQuantity;
  if (nextQuantity > Number(product.stock ?? 0)) {
    throw new Error("Jumlah di keranjang melebihi stok produk.");
  }
  if (existingCart) {
    const { data: data2, error: error2 } = await db$1.from("cart_items").update({
      quantity: nextQuantity,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", existingCart.id).eq("buyer_id", cleanBuyerId).select("*").single();
    if (error2) {
      throw new Error(error2.message);
    }
    notifyCartChanged();
    return data2;
  }
  const { data, error } = await db$1.from("cart_items").insert({
    buyer_id: cleanBuyerId,
    product_id: cleanProductId,
    quantity: cleanQuantity,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  notifyCartChanged();
  return data;
}
async function checkWishlistStatus({
  buyerId,
  productId
}) {
  const cleanBuyerId = String(buyerId ?? "").trim();
  const cleanProductId = String(productId ?? "").trim();
  if (!cleanBuyerId || !cleanProductId) return false;
  const { data, error } = await db$1.from("wishlists").select("id").eq("buyer_id", cleanBuyerId).eq("product_id", cleanProductId).maybeSingle();
  if (error) {
    return false;
  }
  return Boolean(data);
}
async function toggleProductWishlist({
  buyerId,
  productId,
  currentStatus
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
    const { error: error2 } = await db$1.from("wishlists").delete().eq("buyer_id", cleanBuyerId).eq("product_id", cleanProductId);
    if (error2) {
      throw new Error(error2.message);
    }
    return false;
  }
  const { error } = await db$1.from("wishlists").insert({
    buyer_id: cleanBuyerId,
    product_id: cleanProductId,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (error) {
    throw new Error(error.message);
  }
  return true;
}
function notifyCartChanged() {
  window.dispatchEvent(new Event("cart-updated"));
}
const db = supabase;
function ProductDetailPage() {
  const params = Route.useParams();
  const {
    user
  } = useAuth();
  const productId = String(params.id ?? "").trim();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
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
      const {
        data: productData,
        error: productError
      } = await db.from("products").select("*").eq("id", productId).maybeSingle();
      if (productError) {
        throw new Error(productError.message);
      }
      if (!productData) {
        setProduct(null);
        setLoading(false);
        return;
      }
      const safeProduct = productData;
      setProduct(safeProduct);
      const images2 = Array.isArray(safeProduct.images) ? safeProduct.images.filter(Boolean) : [];
      setSelectedImage(images2[0] ?? "");
      if (safeProduct.category_id) {
        const {
          data: categoryData
        } = await db.from("categories").select("id, name").eq("id", safeProduct.category_id).maybeSingle();
        setCategory(categoryData ?? null);
      }
      if (safeProduct.seller_id) {
        const {
          data: sellerData
        } = await db.from("profiles").select("id, full_name, avatar_url, city, shop_name, shop_location, shop_logo_url").eq("id", safeProduct.seller_id).maybeSingle();
        setSeller(sellerData ?? null);
      }
      try {
        const {
          data: reviewData
        } = await db.from("reviews").select("id, rating, comment, created_at").eq("product_id", safeProduct.id).order("created_at", {
          ascending: false
        });
        setReviews(reviewData ?? []);
      } catch {
        setReviews([]);
      }
      if (user?.id) {
        const wishlistStatus = await checkWishlistStatus({
          buyerId: user.id,
          productId: safeProduct.id
        });
        setIsWishlisted(wishlistStatus);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuka detail produk.");
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
    return Math.round((originalPrice - price) / originalPrice * 100);
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
        buyerId: user.id,
        productId,
        quantity
      });
      toast.success("Produk berhasil masuk keranjang.");
      window.location.href = "/keranjang";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan produk ke keranjang.");
    } finally {
      setCartLoading(false);
    }
  }
  async function handleBuyNow() {
    if (!validateBuyerAction()) return;
    setBuyLoading(true);
    try {
      await addProductToCart({
        buyerId: user.id,
        productId,
        quantity
      });
      toast.success("Produk siap di-checkout.");
      window.location.href = `/checkout?buy_now=${productId}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses beli langsung.");
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
        currentStatus: isWishlisted
      });
      setIsWishlisted(nextStatus);
      toast.success(nextStatus ? "Produk ditambahkan ke wishlist." : "Produk dihapus dari wishlist.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  if (!product) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(Store, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-xl font-semibold", children: "Produk tidak ditemukan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Produk mungkin sudah dihapus atau belum tersedia." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Kembali ke Produk" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", className: "mb-6", children: /* @__PURE__ */ jsxs("a", { href: "/produk", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Kembali ke Produk"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1.05fr_0.95fr]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-3xl border border-border bg-card", children: /* @__PURE__ */ jsx("div", { className: "aspect-square bg-muted", children: selectedImage ? /* @__PURE__ */ jsx("img", { src: selectedImage, alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-muted-foreground", children: "Tidak ada foto produk" }) }) }),
          images.length > 1 ? /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-5 gap-3", children: images.map((image) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelectedImage(image), className: `aspect-square overflow-hidden rounded-2xl border ${selectedImage === image ? "border-primary" : "border-border"}`, children: /* @__PURE__ */ jsx("img", { src: image, alt: product.title, className: "h-full w-full object-cover" }) }, image)) }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground", children: category?.name ?? "Produk" }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full border border-border px-3 py-1 text-xs font-medium", children: conditionLabel(product.condition) }),
              status !== "approved" ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800", children: "Belum tersedia" }) : null
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-bold", children: product.title }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
                product.location || "-"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Stok: ",
                stock
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                sold,
                " terjual"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-1", children: [
              Array.from({
                length: 5
              }).map((_, index) => /* @__PURE__ */ jsx(Star, { className: `h-4 w-4 ${index < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"}` }, index)),
              /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm text-muted-foreground", children: reviews.length > 0 ? `${averageRating.toFixed(1)} (${reviews.length} ulasan)` : "Belum ada ulasan" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap items-end gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-primary", children: formatIDR(price) }),
              originalPrice > price ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground line-through", children: formatIDR(originalPrice) }),
                discount > 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white", children: [
                  "-",
                  discount,
                  "%"
                ] }) : null
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t border-border pt-5", children: [
              /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Deskripsi Produk" }),
              /* @__PURE__ */ jsx("p", { className: "mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground", children: product.description || "Tidak ada deskripsi produk." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Atur Pembelian" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Jumlah" }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: stock, value: quantity, onChange: (event) => setQuantity(Number(event.target.value || 1)) }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                "Stok tersedia: ",
                stock
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatIDR(price * quantity) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid grid-cols-[1fr_auto] gap-2", children: [
              /* @__PURE__ */ jsxs(Button, { type: "button", disabled: !canBuy || cartLoading, onClick: handleAddCart, variant: "outline", className: "w-full", children: [
                cartLoading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(ShoppingCart, { className: "mr-2 h-4 w-4" }),
                "Keranjang"
              ] }),
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: wishlistLoading, onClick: handleWishlist, className: isWishlisted ? "text-red-500" : "", children: /* @__PURE__ */ jsx(Heart, { className: `h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}` }) })
            ] }),
            /* @__PURE__ */ jsxs(Button, { type: "button", disabled: !canBuy || buyLoading, onClick: handleBuyNow, className: "mt-3 w-full gradient-brand text-white", children: [
              buyLoading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Zap, { className: "mr-2 h-4 w-4" }),
              "Beli Sekarang"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Informasi Penjual" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "h-12 w-12 overflow-hidden rounded-2xl bg-primary/10 text-primary", children: seller?.shop_logo_url || seller?.avatar_url ? /* @__PURE__ */ jsx("img", { src: seller.shop_logo_url || seller.avatar_url || "", alt: seller.shop_name || seller.full_name || "Seller", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center", children: /* @__PURE__ */ jsx(UserRound, { className: "h-6 w-6" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold", children: seller?.shop_name || seller?.full_name || "Seller ReVibe" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: seller?.shop_location || seller?.city || "-" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2 md:grid-cols-2", children: [
              /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/toko/${sellerId}`, children: [
                /* @__PURE__ */ jsx(Store, { className: "mr-2 h-4 w-4" }),
                "Lihat Toko"
              ] }) }),
              /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/chat?product_id=${product.id}&seller_id=${sellerId}`, children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "mr-2 h-4 w-4" }),
                "Chat Penjual"
              ] }) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-10 rounded-3xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Ulasan Pembeli" }),
        /* @__PURE__ */ jsx("div", { className: "mt-5", children: reviews.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "Belum ada ulasan untuk produk ini." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: reviews.map((review) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-background p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: Array.from({
            length: 5
          }).map((_, index) => /* @__PURE__ */ jsx(Star, { className: `h-4 w-4 ${index < Number(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"}` }, index)) }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-muted-foreground", children: review.comment || "Tidak ada komentar." }),
          review.created_at ? /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: new Date(review.created_at).toLocaleString("id-ID") }) : null
        ] }, review.id)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
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
  ProductDetailPage as component
};
