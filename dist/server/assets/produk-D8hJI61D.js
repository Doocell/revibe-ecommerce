import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { P as ProductCard } from "./ProductCard-DZau9l-V.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { Search, Loader2 } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "sonner";
import "./reviews-CeiujS0R.js";
async function getApprovedProducts() {
  const { data, error } = await supabase.from("products").select("*, categories(id, name, slug)").eq("status", "approved").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
async function getCategories() {
  const { data, error } = await supabase.from("categories").select("id, name, slug, icon, created_at").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
function getCategorySlug(product) {
  return product.categories?.slug ?? "lainnya";
}
const conditions = [{
  value: "all",
  label: "Semua Kondisi"
}, {
  value: "like_new",
  label: "Seperti Baru"
}, {
  value: "very_good",
  label: "Sangat Baik"
}, {
  value: "good",
  label: "Baik"
}, {
  value: "fair",
  label: "Cukup"
}];
function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [cond, setCond] = useState("all");
  const [max, setMax] = useState(2e7);
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [productRows, categoryRows] = await Promise.all([getApprovedProducts(), getCategories()]);
        if (!alive) return;
        setProducts(productRows);
        setCategories(categoryRows);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Gagal memuat produk.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return products.filter((p) => {
      const categorySlug = getCategorySlug(p);
      const title = p.title.toLowerCase();
      const description = (p.description ?? "").toLowerCase();
      if (keyword && !title.includes(keyword) && !description.includes(keyword)) {
        return false;
      }
      if (cat !== "all" && categorySlug !== cat) return false;
      if (cond !== "all" && p.condition !== cond) return false;
      if (Number(p.price) > max) return false;
      return true;
    });
  }, [products, q, cat, cond, max]);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold md:text-4xl", children: "Produk Preloved" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Cari dan saring barang preloved yang sudah disetujui admin." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-[260px_1fr]", children: [
        /* @__PURE__ */ jsxs("aside", { className: "space-y-6 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20 lg:h-fit", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold", children: "Cari" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), className: "pl-10", placeholder: "Cari produk…" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold", children: "Kategori" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(FilterChip, { active: cat === "all", onClick: () => setCat("all"), children: "Semua Kategori" }),
              categories.map((c) => /* @__PURE__ */ jsx(FilterChip, { active: cat === c.slug, onClick: () => setCat(c.slug), children: c.name }, c.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold", children: "Kondisi" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1", children: conditions.map((c) => /* @__PURE__ */ jsx(FilterChip, { active: cond === c.value, onClick: () => setCond(c.value), children: c.label }, c.value)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold", children: "Harga Maksimum" }),
            /* @__PURE__ */ jsx("input", { type: "range", min: 5e4, max: 2e7, step: 5e4, value: max, onChange: (e) => setMax(Number(e.target.value)), className: "w-full accent-[var(--brand-green)]" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
              "Sampai Rp ",
              new Intl.NumberFormat("id-ID").format(max)
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", onClick: () => {
            setQ("");
            setCat("all");
            setCond("all");
            setMax(2e7);
          }, children: "Reset Filter" })
        ] }),
        /* @__PURE__ */ jsx("div", { children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : error ? /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-destructive/30 bg-card p-8 text-center text-sm text-destructive", children: error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 text-sm text-muted-foreground", children: [
            filtered.length,
            " produk ditemukan"
          ] }),
          filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground", children: "Belum ada produk yang cocok. Jika database masih kosong, lanjutkan ke tahap upload produk penjual." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-3", children: filtered.map((p) => /* @__PURE__ */ jsx(ProductCard, { product: p }, p.id)) })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function FilterChip({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `w-full rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-primary font-medium text-primary-foreground" : "hover:bg-accent"}`, children });
}
export {
  ProdukPage as component
};
