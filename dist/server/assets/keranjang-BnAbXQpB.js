import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { u as useAuth, N as Navbar, B as Button, F as Footer, s as supabase } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { ShoppingCart, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
function CartPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  async function loadCart() {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await db.from("cart_items").select(`
          id,
          buyer_id,
          product_id,
          quantity,
          products(
            id,
            seller_id,
            title,
            description,
            price,
            original_price,
            stock,
            images,
            status,
            location
          )
        `).eq("buyer_id", user.id).order("created_at", {
        ascending: false
      });
      if (error) throw new Error(error.message);
      setItems(data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat keranjang.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadCart();
    function handleCartUpdated() {
      loadCart();
    }
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [user?.id]);
  const validItems = items.filter((item) => item.products);
  const subtotal = useMemo(() => {
    return validItems.reduce((sum, item) => {
      return sum + Number(item.products?.price ?? 0) * Number(item.quantity);
    }, 0);
  }, [validItems]);
  async function updateQuantity(item, nextQuantity) {
    if (!user?.id) return;
    const stock = Number(item.products?.stock ?? 0);
    if (nextQuantity <= 0) {
      await removeItem(item);
      return;
    }
    if (nextQuantity > stock) {
      toast.error("Jumlah melebihi stok produk.");
      return;
    }
    setUpdatingId(item.id);
    try {
      const {
        error
      } = await db.from("cart_items").update({
        quantity: nextQuantity,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", item.id).eq("buyer_id", user.id);
      if (error) throw new Error(error.message);
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah jumlah.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function removeItem(item) {
    if (!user?.id) return;
    setUpdatingId(item.id);
    try {
      const {
        error
      } = await db.from("cart_items").delete().eq("id", item.id).eq("buyer_id", user.id);
      if (error) throw new Error(error.message);
      toast.success("Produk dihapus dari keranjang.");
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus produk.");
    } finally {
      setUpdatingId(null);
    }
  }
  if (!user?.id) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Keranjang Belanja" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login sebagai pembeli untuk melihat keranjang." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login Pembeli" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Keranjang Belanja" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Produk yang kamu pilih sebelum checkout." })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : validItems.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Keranjang masih kosong" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tambahkan produk terlebih dahulu dari halaman produk." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Belanja Sekarang" }) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[1fr_360px]", children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: validItems.map((item) => /* @__PURE__ */ jsx(CartItemCard, { item, updating: updatingId === item.id, onDecrease: () => updateQuantity(item, item.quantity - 1), onIncrease: () => updateQuantity(item, item.quantity + 1), onChangeQuantity: (value) => updateQuantity(item, value), onRemove: () => removeItem(item) }, item.id)) }),
        /* @__PURE__ */ jsxs("div", { className: "h-fit rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Ringkasan Belanja" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Total Produk" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: validItems.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatIDR(subtotal) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-5 border-t border-border pt-5", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-bold", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: formatIDR(subtotal) })
          ] }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 w-full gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/checkout", children: "Lanjut Checkout" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", className: "mt-3 w-full", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Tambah Produk Lagi" }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function CartItemCard({
  item,
  updating,
  onDecrease,
  onIncrease,
  onChangeQuantity,
  onRemove
}) {
  const product = item.products;
  const image = product.images?.[0];
  const price = Number(product.price ?? 0);
  const stock = Number(product.stock ?? 0);
  const lineTotal = price * Number(item.quantity);
  return /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-[120px_1fr_auto]", children: [
    /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, className: "h-28 w-full overflow-hidden rounded-xl bg-muted md:w-28", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "Tidak ada foto" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${product.id}`, children: /* @__PURE__ */ jsx("h2", { className: "line-clamp-1 font-semibold hover:text-primary", children: product.title }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: product.description || "Tidak ada deskripsi." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 text-sm text-muted-foreground", children: [
        "Stok tersedia: ",
        stock
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 font-bold text-primary", children: formatIDR(price) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 md:w-44", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: updating, onClick: onDecrease, children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: stock, value: item.quantity, onChange: (event) => onChangeQuantity(Number(event.target.value || 1)), className: "text-center" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: updating, onClick: onIncrease, children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Subtotal" }),
        /* @__PURE__ */ jsx("div", { className: "font-bold", children: formatIDR(lineTotal) })
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", disabled: updating, onClick: onRemove, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
        "Hapus"
      ] })
    ] })
  ] }) });
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
export {
  CartPage as component
};
