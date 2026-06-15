import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { b as getSellerProducts, d as productStatusLabel, f as formatIDR, c as conditionLabel, e as updateSellerProductStock, u as updateSellerProductStatus } from "./seller-products-EQn63_09.js";
import { ArrowLeft, PlusCircle, Loader2, RefreshCw, Search, Boxes, Save, XCircle } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
function SellerProductsPage() {
  const {
    user
  } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  async function loadProducts() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getSellerProducts(user.id);
      setProducts(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadProducts();
  }, [user?.id]);
  const filteredProducts = products.filter((product) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return product.title.toLowerCase().includes(keyword) || String(product.description ?? "").toLowerCase().includes(keyword) || String(product.location ?? "").toLowerCase().includes(keyword);
  });
  async function handleInactive(product) {
    if (!user) return;
    const confirmed = window.confirm(`Nonaktifkan produk ${product.title}?`);
    if (!confirmed) return;
    setUpdatingId(product.id);
    try {
      await updateSellerProductStatus({
        sellerId: user.id,
        productId: product.id,
        status: "inactive"
      });
      toast.success("Produk berhasil dinonaktifkan.");
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menonaktifkan produk.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleUpdateStock(product, stock) {
    if (!user) return;
    setUpdatingId(product.id);
    try {
      await updateSellerProductStock({
        sellerId: user.id,
        productId: product.id,
        stock
      });
      toast.success("Stok berhasil diperbarui.");
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui stok.");
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Produk Saya" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Kelola produk, stok, dan status verifikasi produk toko kamu." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/penjual", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard"
          ] }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/penjual/produk/tambah", children: [
            /* @__PURE__ */ jsx(PlusCircle, { className: "mr-2 h-4 w-4" }),
            "Tambah Produk"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadProducts, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari produk...", className: "pl-9" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : filteredProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(Boxes, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada produk" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tambahkan produk pertama kamu." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual/produk/tambah", children: "Tambah Produk" }) })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: filteredProducts.map((product) => /* @__PURE__ */ jsx(SellerProductCard, { product, updating: updatingId === product.id, onInactive: () => handleInactive(product), onUpdateStock: (stock) => handleUpdateStock(product, stock) }, product.id)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function SellerProductCard({
  product,
  updating,
  onInactive,
  onUpdateStock
}) {
  const [stock, setStock] = useState(String(product.stock ?? 0));
  const image = product.images?.[0];
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[120px_1fr_auto]", children: [
    /* @__PURE__ */ jsx("div", { className: "h-28 w-full overflow-hidden rounded-xl bg-muted md:w-28", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: product.title }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: productStatusLabel(product.status) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: product.description || "Tidak ada deskripsi." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-1 text-sm text-muted-foreground md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "Harga:",
          " ",
          /* @__PURE__ */ jsx("b", { className: "text-foreground", children: formatIDR(Number(product.price)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Kondisi: ",
          conditionLabel(product.condition)
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Kategori: ",
          product.categories?.name ?? "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Lokasi: ",
          product.location ?? "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Terjual: ",
          product.sold ?? 0
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 md:w-44 md:flex-col", children: [
      /* @__PURE__ */ jsx(Input, { type: "number", min: 0, value: stock, onChange: (event) => setStock(event.target.value) }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: updating, onClick: () => onUpdateStock(Number(stock)), children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
        "Simpan Stok"
      ] }),
      product.status !== "inactive" ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", disabled: updating, onClick: onInactive, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }),
        "Nonaktifkan"
      ] }) : null
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerProductsPage, {}) });
export {
  SplitComponent as component
};
