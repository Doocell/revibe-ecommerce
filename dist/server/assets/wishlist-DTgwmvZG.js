import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { ShoppingBag, Loader2, Heart, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function removeFromWishlist({
  buyerId,
  productId
}) {
  const { error } = await db.from("wishlists").delete().eq("buyer_id", buyerId).eq("product_id", productId);
  if (error) {
    throw new Error(error.message);
  }
}
async function getBuyerWishlist(buyerId) {
  const { data, error } = await db.from("wishlists").select(
    `
      *,
      products(
        id,
        title,
        price,
        original_price,
        images,
        location,
        condition,
        stock,
        status,
        categories(id, name, slug)
      )
    `
  ).eq("buyer_id", buyerId).order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
function conditionLabel(condition) {
  const labels = {
    like_new: "Seperti Baru",
    very_good: "Sangat Baik",
    good: "Baik",
    fair: "Cukup"
  };
  if (!condition) return "-";
  return labels[condition] ?? condition;
}
function WishlistPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingProductId, setRemovingProductId] = useState(null);
  async function loadWishlist() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getBuyerWishlist(user.id);
      setItems(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat wishlist.");
      console.error("[Load Wishlist Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadWishlist();
  }, [user]);
  async function handleRemove(productId) {
    if (!user) return;
    const confirmed = window.confirm("Hapus produk ini dari wishlist?");
    if (!confirmed) return;
    setRemovingProductId(productId);
    try {
      await removeFromWishlist({
        buyerId: user.id,
        productId
      });
      setItems((current) => current.filter((item) => item.product_id !== productId));
      toast.success("Produk dihapus dari wishlist.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus produk dari wishlist.");
      console.error("[Remove Wishlist Error]", error);
    } finally {
      setRemovingProductId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Wishlist" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Produk favorit yang kamu simpan untuk dibeli nanti." })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsxs("a", { href: "/produk", children: [
          /* @__PURE__ */ jsx(ShoppingBag, { className: "mr-2 h-4 w-4" }),
          "Cari Produk"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : items.length === 0 ? /* @__PURE__ */ jsx(EmptyWishlist, {}) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: items.map((item) => item.products ? /* @__PURE__ */ jsx(WishlistCard, { item, removing: removingProductId === item.product_id, onRemove: () => handleRemove(item.product_id) }, item.id) : null) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function WishlistCard({
  item,
  removing,
  onRemove
}) {
  const product = item.products;
  if (!product) return null;
  const image = product.images?.[0];
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-2xl border border-border bg-card", children: [
    /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, className: "block aspect-square bg-muted", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-sm text-muted-foreground", children: "No Image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-2 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground", children: product.categories?.name ?? "Tanpa kategori" }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground", children: conditionLabel(product.condition) })
      ] }),
      /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, className: "line-clamp-2 min-h-12 font-semibold hover:text-primary", children: product.title }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 text-lg font-bold text-primary", children: formatIDR(Number(product.price)) }),
      product.original_price && Number(product.original_price) > Number(product.price) ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground line-through", children: formatIDR(Number(product.original_price)) }) : null,
      /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
        "Stok: ",
        product.stock,
        " · ",
        product.location || "Indonesia"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, children: "Lihat Detail" }) }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: removing, onClick: onRemove, children: [
          removing ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
          "Hapus"
        ] })
      ] })
    ] })
  ] });
}
function EmptyWishlist() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Heart, { className: "h-7 w-7" }) }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Wishlist masih kosong" }),
    /* @__PURE__ */ jsx("p", { className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground", children: "Simpan produk favorit dari halaman detail produk agar mudah ditemukan lagi." }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Lihat Produk" }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "buyer", children: /* @__PURE__ */ jsx(WishlistPage, {}) });
export {
  SplitComponent as component
};
