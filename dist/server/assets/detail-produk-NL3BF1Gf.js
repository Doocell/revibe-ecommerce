import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Package, Tag, Truck, MapPin, Sparkles, ShoppingCart, Zap, Heart, MessageCircle, ShieldCheck, Store } from "lucide-react";
import { u as useAuth, N as Navbar, F as Footer, B as Button, s as supabase } from "./Navbar-BfYtpR_3.js";
import { a as ProductRatingInline, b as ProductReviewSection, P as ProductCard } from "./ProductCard-DZau9l-V.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "./reviews-CeiujS0R.js";
const db = supabase;
function ProductDetailPage() {
  const {
    user,
    roles
  } = useAuth();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
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
      const {
        data: productData,
        error: productError
      } = await db.from("products").select("*").eq("id", productId).maybeSingle();
      if (productError) {
        throw new Error(productError.message);
      }
      if (!productData) {
        setProduct(null);
        return;
      }
      const currentProduct = productData;
      setProduct(currentProduct);
      const images2 = getProductImages(currentProduct);
      setSelectedImage(images2[0] ?? "");
      const sellerId = currentProduct.seller_id;
      const categoryId = currentProduct.category_id;
      const [sellerResult, categoryResult, relatedResult] = await Promise.all([sellerId ? db.from("profiles").select("id, full_name, shop_name, shop_location, shop_description, shop_logo_url, avatar_url, whatsapp, city, bio").eq("id", sellerId).maybeSingle() : Promise.resolve({
        data: null,
        error: null
      }), categoryId ? db.from("categories").select("id, name, slug").eq("id", categoryId).maybeSingle() : Promise.resolve({
        data: null,
        error: null
      }), categoryId ? db.from("products").select(`
                *,
                categories(id, name, slug)
              `).eq("category_id", categoryId).eq("status", "approved").neq("id", productId).order("created_at", {
        ascending: false
      }).limit(4) : db.from("products").select(`
                *,
                categories(id, name, slug)
              `).eq("status", "approved").neq("id", productId).order("created_at", {
        ascending: false
      }).limit(4)]);
      if (sellerResult.error) {
        console.error("[Detail Product Seller Error]", sellerResult.error);
      }
      if (categoryResult.error) {
        console.error("[Detail Product Category Error]", categoryResult.error);
      }
      if (relatedResult.error) {
        console.error("[Detail Product Related Error]", relatedResult.error);
      }
      setSeller(sellerResult.data ?? null);
      setCategory(categoryResult.data ?? null);
      setRelatedProducts(relatedResult.data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat detail produk.");
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
        productId
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
    const stock2 = getProductStock(product);
    const {
      data: existingItem,
      error: existingError
    } = await db.from("cart_items").select("id, quantity").eq("buyer_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existingError) {
      throw new Error(existingError.message);
    }
    if (existingItem?.id) {
      const currentQuantity = Number(existingItem.quantity ?? 0);
      const nextQuantity = currentQuantity + quantity;
      if (nextQuantity > stock2) {
        throw new Error("Jumlah produk di keranjang melebihi stok.");
      }
      const {
        error
      } = await db.from("cart_items").update({
        quantity: nextQuantity,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", existingItem.id).eq("buyer_id", user.id);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      if (quantity > stock2) {
        throw new Error("Jumlah produk melebihi stok.");
      }
      const {
        error
      } = await db.from("cart_items").insert({
        buyer_id: user.id,
        product_id: product.id,
        quantity,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
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
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan keranjang.");
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
      toast.error(error instanceof Error ? error.message : "Gagal memproses beli sekarang.");
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
        productId: product.id
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
          productId: product.id
        });
        setWishlisted(true);
        toast.success("Produk ditambahkan ke wishlist.");
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto flex min-h-96 items-center justify-center px-4 py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  if (!product) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-dashed border-border p-10 text-center", children: [
        /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Produk tidak ditemukan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Produk mungkin sudah dihapus atau tidak tersedia." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Kembali ke Produk" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  const images = getProductImages(product);
  const price = Number(product.price ?? 0);
  const originalPrice = Number(product.original_price ?? 0);
  const stock = getProductStock(product);
  const sold = Number(product.sold ?? 0);
  const isAvailable = isProductApproved(product) && stock > 0;
  const discountPercent = originalPrice > price && price > 0 ? Math.round((originalPrice - price) / originalPrice * 100) : 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_1fr]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-3xl border border-border bg-muted", children: selectedImage ? /* @__PURE__ */ jsx("img", { src: selectedImage, alt: product.title, className: "aspect-square w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex aspect-square items-center justify-center text-muted-foreground", children: "Tidak ada foto" }) }),
          images.length > 1 ? /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-5 gap-3", children: images.map((image, index) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelectedImage(image), className: `overflow-hidden rounded-xl border transition ${selectedImage === image ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`, children: /* @__PURE__ */ jsx("img", { src: image, alt: `${product.title} ${index + 1}`, className: "aspect-square w-full object-cover" }) }, `${image}-${index}`)) }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${isProductApproved(product) ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`, children: productStatusLabel(product.status) }),
              category ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium", children: [
                /* @__PURE__ */ jsx(Tag, { className: "h-3 w-3" }),
                category.name
              ] }) : null,
              discountPercent > 0 ? /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground", children: [
                "Diskon ",
                discountPercent,
                "%"
              ] }) : null
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-bold", children: product.title }),
            /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(ProductRatingInline, { productId: product.id, averageRating: product.average_rating, reviewCount: product.review_count }) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
              /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-primary", children: formatIDR(price) }),
              originalPrice > price ? /* @__PURE__ */ jsx("div", { className: "mt-1 text-muted-foreground line-through", children: formatIDR(originalPrice) }) : null
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 rounded-2xl bg-accent p-4 text-sm md:grid-cols-2", children: [
              /* @__PURE__ */ jsx(Info, { icon: /* @__PURE__ */ jsx(Package, { className: "h-4 w-4" }), label: "Stok", value: `${stock} tersedia` }),
              /* @__PURE__ */ jsx(Info, { icon: /* @__PURE__ */ jsx(Truck, { className: "h-4 w-4" }), label: "Terjual", value: `${sold} produk` }),
              /* @__PURE__ */ jsx(Info, { icon: /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }), label: "Lokasi", value: product.location || "-" }),
              /* @__PURE__ */ jsx(Info, { icon: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }), label: "Kondisi", value: conditionLabel(product.condition) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
              /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Deskripsi Produk" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 whitespace-pre-line leading-7 text-muted-foreground", children: product.description || "Tidak ada deskripsi." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Jumlah" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex w-fit items-center rounded-xl border border-border", children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setQuantity((current) => Math.max(1, current - 1)), className: "px-4 py-2 text-lg", children: "-" }),
                /* @__PURE__ */ jsx("div", { className: "min-w-12 px-4 py-2 text-center", children: quantity }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setQuantity((current) => Math.min(stock, current + 1)), className: "px-4 py-2 text-lg", children: "+" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: !isAvailable || cartLoading, onClick: handleAddToCart, children: [
                cartLoading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(ShoppingCart, { className: "mr-2 h-4 w-4" }),
                "Keranjang"
              ] }),
              /* @__PURE__ */ jsxs(Button, { type: "button", disabled: !isAvailable || buyLoading, onClick: handleBuyNow, className: "gradient-brand text-white", children: [
                buyLoading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Zap, { className: "mr-2 h-4 w-4" }),
                "Beli Sekarang"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: wishlistLoading, onClick: handleWishlist, children: [
                wishlistLoading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Heart, { className: `mr-2 h-4 w-4 ${wishlisted ? "fill-current text-destructive" : ""}` }),
                wishlisted ? "Hapus Wishlist" : "Wishlist"
              ] }),
              /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: buildChatUrl(product, seller), children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "mr-2 h-4 w-4" }),
                "Chat Seller"
              ] }) })
            ] }),
            !isAvailable ? /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive", children: "Produk belum bisa dibeli karena belum aktif atau stok habis." }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-3xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Informasi Toko" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Detail seller produk ini." })
              ] }),
              /* @__PURE__ */ jsx(ShieldCheck, { className: "h-6 w-6 text-primary" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted", children: seller?.shop_logo_url || seller?.avatar_url ? /* @__PURE__ */ jsx("img", { src: seller.shop_logo_url ?? seller.avatar_url ?? "", alt: seller.shop_name ?? seller.full_name ?? "Toko", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "Toko" }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold", children: seller?.shop_name || seller?.full_name || "Seller" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: seller?.shop_location || seller?.city || product.location || "-" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-muted-foreground", children: seller?.shop_description || seller?.bio || "Seller ReVibe yang menjual produk preloved." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: buildChatUrl(product, seller), children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "mr-2 h-4 w-4" }),
                "Hubungi Seller"
              ] }) }),
              /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/produk", children: [
                /* @__PURE__ */ jsx(Store, { className: "mr-2 h-4 w-4" }),
                "Lanjut Belanja"
              ] }) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ProductReviewSection, { productId: product.id }),
      relatedProducts.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Produk Serupa" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Produk lain yang mungkin kamu suka." })
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Lihat Semua Produk" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4", children: relatedProducts.map((item) => /* @__PURE__ */ jsx(ProductCard, { product: item }, item.id)) })
      ] }) : null
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function Info({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-background p-2 text-primary", children: icon }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "font-medium", children: value })
    ] })
  ] });
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
  const thirdAttempt = await db.from("wishlists").select("id").eq("user_id", buyerId).eq("product_id", productId).maybeSingle();
  if (!thirdAttempt.error) {
    return thirdAttempt.data;
  }
  return null;
}
async function insertWishlistItem({
  buyerId,
  productId
}) {
  const buyerPayload = {
    buyer_id: buyerId,
    product_id: productId,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const firstAttempt = await db.from("wishlists").insert(buyerPayload).select("id").single();
  if (!firstAttempt.error) {
    return firstAttempt.data;
  }
  const secondAttempt = await db.from("wishlist_items").insert(buyerPayload).select("id").single();
  if (!secondAttempt.error) {
    return secondAttempt.data;
  }
  const userPayload = {
    user_id: buyerId,
    product_id: productId,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const thirdAttempt = await db.from("wishlists").insert(userPayload).select("id").single();
  if (!thirdAttempt.error) {
    return thirdAttempt.data;
  }
  throw new Error(firstAttempt.error.message || secondAttempt.error.message || thirdAttempt.error.message);
}
async function deleteWishlistItem({
  wishlistId,
  buyerId
}) {
  const firstAttempt = await db.from("wishlists").delete().eq("id", wishlistId).eq("buyer_id", buyerId);
  if (!firstAttempt.error) return;
  const secondAttempt = await db.from("wishlist_items").delete().eq("id", wishlistId).eq("buyer_id", buyerId);
  if (!secondAttempt.error) return;
  const thirdAttempt = await db.from("wishlists").delete().eq("id", wishlistId).eq("user_id", buyerId);
  if (!thirdAttempt.error) return;
  throw new Error(firstAttempt.error.message || secondAttempt.error.message || thirdAttempt.error.message);
}
function getProductImages(product) {
  if (Array.isArray(product.images)) {
    return product.images.filter(Boolean);
  }
  if (product.image_url) {
    return [String(product.image_url)];
  }
  return [];
}
function getProductStock(product) {
  return Number(product.stock ?? 0);
}
function isProductApproved(product) {
  const status = String(product.status ?? "");
  return status === "approved" || status === "active";
}
function buildChatUrl(product, seller) {
  const sellerId = seller?.id ?? product.seller_id;
  if (!sellerId) return "/chat";
  return `/chat?seller=${sellerId}&product=${product.id}`;
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
  ProductDetailPage as component
};
