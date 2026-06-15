import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { N as Navbar, F as Footer } from "./Navbar-BfYtpR_3.js";
import { c as categories, d as dummyProducts } from "./products-BjTdyzSE.js";
import "lucide-react";
import "react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
function KategoriPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold md:text-4xl", children: "Semua Kategori" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Pilih kategori untuk mulai berburu barang preloved favoritmu." }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-2 gap-4 md:grid-cols-3", children: categories.map((c) => {
        const count = dummyProducts.filter((p) => p.category === c.slug).length;
        return /* @__PURE__ */ jsxs(Link, { to: "/produk", className: "group rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-brand", children: [
          /* @__PURE__ */ jsx("div", { className: "grid h-14 w-14 place-items-center rounded-2xl bg-accent text-3xl", children: c.emoji }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold group-hover:text-primary", children: c.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            count,
            "+ produk tersedia"
          ] })
        ] }, c.slug);
      }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
export {
  KategoriPage as component
};
