import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { p as parseImageUrls, g as getSellerCategories, a as createSellerProduct } from "./seller-products-EQn63_09.js";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@radix-ui/react-label";
function SellerAddProductPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  const [stock, setStock] = useState("1");
  const [imageUrls, setImageUrls] = useState("");
  async function loadCategories() {
    setLoading(true);
    try {
      const rows = await getSellerCategories();
      setCategories(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadCategories();
  }, []);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await createSellerProduct({
        sellerId: user.id,
        title,
        description,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        category_id: categoryId || null,
        condition,
        location,
        stock: Number(stock),
        images: parseImageUrls(imageUrls)
      });
      toast.success("Produk berhasil ditambahkan dan menunggu verifikasi admin.");
      navigate({
        to: "/dashboard/penjual/produk"
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan produk.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Tambah Produk" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Tambahkan produk preloved baru. Produk akan tampil setelah diverifikasi admin." })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/penjual", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
          "Dashboard Penjual"
        ] }) })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informasi Produk" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nama Produk" }),
                /* @__PURE__ */ jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value), placeholder: "Contoh: Jaket Denim Preloved" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Deskripsi Produk" }),
                /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (event) => setDescription(event.target.value), rows: 5, placeholder: "Jelaskan kondisi, ukuran, minus, dan detail produk." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Harga Jual" }),
                  /* @__PURE__ */ jsx(Input, { type: "number", value: price, onChange: (event) => setPrice(event.target.value), placeholder: "100000" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Harga Awal / Coret" }),
                  /* @__PURE__ */ jsx(Input, { type: "number", value: originalPrice, onChange: (event) => setOriginalPrice(event.target.value), placeholder: "150000" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Kategori" }),
                  /* @__PURE__ */ jsxs("select", { value: categoryId, onChange: (event) => setCategoryId(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Pilih kategori" }),
                    categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Kondisi" }),
                  /* @__PURE__ */ jsxs("select", { value: condition, onChange: (event) => setCondition(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: [
                    /* @__PURE__ */ jsx("option", { value: "like_new", children: "Seperti Baru" }),
                    /* @__PURE__ */ jsx("option", { value: "very_good", children: "Sangat Baik" }),
                    /* @__PURE__ */ jsx("option", { value: "good", children: "Baik" }),
                    /* @__PURE__ */ jsx("option", { value: "fair", children: "Cukup" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Lokasi Produk" }),
                  /* @__PURE__ */ jsx(Input, { value: location, onChange: (event) => setLocation(event.target.value), placeholder: "Contoh: Bandung" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Stok" }),
                  /* @__PURE__ */ jsx(Input, { type: "number", min: 0, value: stock, onChange: (event) => setStock(event.target.value) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "URL Gambar Produk" }),
                /* @__PURE__ */ jsx(Textarea, { value: imageUrls, onChange: (event) => setImageUrls(event.target.value), rows: 5, placeholder: `https://contoh.com/foto-1.jpg
https://contoh.com/foto-2.jpg` }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Masukkan satu URL gambar per baris." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(PlusCircle, { className: "mr-2 h-4 w-4" }),
            "Simpan Produk"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Preview Singkat" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 overflow-hidden rounded-2xl border border-border bg-background", children: [
            /* @__PURE__ */ jsx("div", { className: "aspect-square bg-muted", children: parseImageUrls(imageUrls)[0] ? /* @__PURE__ */ jsx("img", { src: parseImageUrls(imageUrls)[0], alt: title || "Preview produk", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-sm text-muted-foreground", children: "Preview Gambar" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: title || "Nama produk" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: description || "Deskripsi produk akan tampil di sini." }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 font-bold text-primary", children: [
                "Rp ",
                Number(price || 0).toLocaleString("id-ID")
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: "Status awal: Menunggu Verifikasi Admin" })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerAddProductPage, {}) });
export {
  SplitComponent as component
};
