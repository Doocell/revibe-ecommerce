import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { P as ProductCard } from "./ProductCard-DZau9l-V.js";
import { d as dummyProducts, c as categories } from "./products-BjTdyzSE.js";
import { Recycle, Search, ArrowRight, ShieldCheck, Truck, Sparkles } from "lucide-react";
import "react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "sonner";
import "./reviews-CeiujS0R.js";
const hero = "/assets/hero-preloved-ZOnZcdr7.jpeg";
function Home() {
  const featured = dummyProducts.slice(0, 4);
  const latest = [...dummyProducts].reverse().slice(0, 4);
  const popular = [...dummyProducts].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 4);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 gradient-soft", "aria-hidden": true }),
        /* @__PURE__ */ jsxs("div", { className: "container relative mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center", children: [
            /* @__PURE__ */ jsxs("span", { className: "mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground", children: [
              /* @__PURE__ */ jsx(Recycle, { className: "h-3.5 w-3.5" }),
              " Marketplace Preloved #1 di Indonesia"
            ] }),
            /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl", children: [
              "Belanja ",
              /* @__PURE__ */ jsx("span", { className: "text-gradient-brand", children: "preloved" }),
              /* @__PURE__ */ jsx("br", {}),
              "lebih hemat & ramah bumi."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-lg text-base text-muted-foreground md:text-lg", children: "Temukan ribuan barang bekas layak pakai dari penjual terpercaya. Aman, mudah, dan harga ramah di kantong." }),
            /* @__PURE__ */ jsxs("form", { className: "mt-7 flex max-w-lg gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
                /* @__PURE__ */ jsx(Input, { placeholder: "Cari pakaian, tas, elektronik…", className: "h-12 pl-10" })
              ] }),
              /* @__PURE__ */ jsx(Button, { type: "submit", size: "lg", className: "gradient-brand text-white shadow-brand", children: "Cari" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
              /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "gradient-brand text-white shadow-brand", children: /* @__PURE__ */ jsxs(Link, { to: "/produk", children: [
                "Belanja Sekarang ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
              ] }) }),
              /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", variant: "outline", children: /* @__PURE__ */ jsx(Link, { to: "/register/penjual", children: "Jual Barang Preloved" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 grid max-w-md grid-cols-3 gap-4 text-sm", children: [{
              icon: ShieldCheck,
              label: "Pembayaran Aman"
            }, {
              icon: Truck,
              label: "Pengiriman Cepat"
            }, {
              icon: Sparkles,
              label: "Penjual Terverifikasi"
            }].map((b) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center text-muted-foreground", children: [
              /* @__PURE__ */ jsx(b.icon, { className: "mb-1 h-5 w-5 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs", children: b.label })
            ] }, b.label)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -inset-4 -z-10 rounded-3xl gradient-brand opacity-15 blur-3xl" }),
            /* @__PURE__ */ jsx("img", { src: hero, alt: "Koleksi barang preloved ReVibe", width: 1600, height: 1200, className: "aspect-[4/3] w-full rounded-3xl object-cover shadow-brand" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "border-y border-border bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-5 text-lg font-semibold", children: "Telusuri Kategori" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3 md:grid-cols-6", children: categories.map((c) => /* @__PURE__ */ jsxs(Link, { to: "/produk", className: "group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-brand", children: [
          /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded-full bg-accent text-2xl", children: c.emoji }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium group-hover:text-primary", children: c.name })
        ] }, c.slug)) })
      ] }) }),
      /* @__PURE__ */ jsx(ProductSection, { title: "Rekomendasi Untukmu", subtitle: "Pilihan editor minggu ini", items: featured }),
      /* @__PURE__ */ jsx(ProductSection, { title: "Produk Populer", subtitle: "Paling banyak terjual", items: popular, highlight: true }),
      /* @__PURE__ */ jsx(ProductSection, { title: "Produk Terbaru", subtitle: "Baru saja ditambahkan", items: latest }),
      /* @__PURE__ */ jsx("section", { className: "bg-accent/40 py-16", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto grid gap-10 px-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold md:text-4xl", children: "Kenapa memilih barang preloved?" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "Setiap barang yang dipakai ulang berarti satu langkah kecil mengurangi limbah tekstil dan elektronik di Indonesia. Hemat budget, kurangi jejak karbon, temukan barang langka." }),
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white shadow-brand", children: /* @__PURE__ */ jsx(Link, { to: "/tentang", children: "Pelajari Lebih Lanjut" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: [{
          n: "85%",
          t: "Lebih hemat dari harga baru"
        }, {
          n: "2.5kg",
          t: "CO₂ dicegah per produk"
        }, {
          n: "10k+",
          t: "Penjual terpercaya"
        }, {
          n: "50k+",
          t: "Barang ditemukan rumah baru"
        }].map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-extrabold text-gradient-brand", children: s.n }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: s.t })
        ] }, s.t)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-16", children: /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-3xl gradient-brand p-10 text-white shadow-brand md:p-14", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-8 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold md:text-4xl", children: "Punya barang nganggur di rumah?" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-white/85", children: "Ubah jadi cuan! Daftar sebagai penjual ReVibe dan jangkau ribuan pembeli setiap hari." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 md:justify-end", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", variant: "secondary", children: /* @__PURE__ */ jsx(Link, { to: "/register/penjual", children: "Jual Barang Preloved" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white", children: /* @__PURE__ */ jsx(Link, { to: "/produk", children: "Belanja Sekarang" }) })
        ] })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function ProductSection({
  title,
  subtitle,
  items,
  highlight
}) {
  return /* @__PURE__ */ jsx("section", { className: highlight ? "bg-muted/40 py-14" : "py-14", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-end justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold md:text-3xl", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: subtitle })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/produk", className: "text-sm font-medium text-primary hover:underline", children: "Lihat semua →" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: items.map((p) => /* @__PURE__ */ jsx(ProductCard, { product: p }, p.id)) })
  ] }) });
}
export {
  Home as component
};
