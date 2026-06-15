import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { u as useAuth, N as Navbar, F as Footer, B as Button } from "./Navbar-BfYtpR_3.js";
import { P as ProductCard } from "./ProductCard-DZau9l-V.js";
import { b as getPublicSellerProfile, a as getPublicSellerProducts } from "./profile-TICuBD3F.js";
import { Loader2, Store, UserRound, MapPin, Package } from "lucide-react";
import { R as Route } from "./router-CwyNLJRw.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "sonner";
import "./reviews-CeiujS0R.js";
import "@tanstack/react-query";
function SellerPublicProfilePage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const {
    user,
    roles,
    loading: authLoading
  } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const safeRoles = roles ?? [];
  const isSeller = safeRoles.includes("seller");
  const sellerIdFromRoute = useMemo(() => {
    return cleanRouteId(params?.sellerId);
  }, [params?.sellerId]);
  const sellerId = useMemo(() => {
    if (sellerIdFromRoute) {
      return sellerIdFromRoute;
    }
    if (isSeller && user?.id) {
      return user.id;
    }
    return "";
  }, [sellerIdFromRoute, isSeller, user?.id]);
  useEffect(() => {
    if (authLoading) return;
    if (!sellerIdFromRoute && isSeller && user?.id) {
      navigate({
        to: "/profil"
      });
    }
  }, [authLoading, sellerIdFromRoute, isSeller, user?.id, navigate]);
  async function loadSellerData() {
    if (authLoading) return;
    if (!sellerId) {
      setProfile(null);
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileRow, productRows] = await Promise.all([getPublicSellerProfile(sellerId), getPublicSellerProducts(sellerId)]);
      setProfile(profileRow);
      setProducts(productRows);
    } catch (error) {
      console.error("[Load Public Seller Profile Error]", error);
      setProfile({
        id: sellerId,
        full_name: "Seller ReVibe",
        avatar_url: null,
        city: null,
        bio: null,
        shop_name: "Toko ReVibe",
        shop_description: null,
        shop_location: "Indonesia",
        shop_logo_url: null
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadSellerData();
  }, [sellerId, authLoading]);
  if (authLoading || loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  if (!sellerId) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(Store, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-xl font-semibold", children: "ID toko tidak valid" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Untuk mengedit toko, buka halaman profil toko dari dashboard penjual." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/profil", children: "Buka Profil Toko" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual", children: "Dashboard Penjual" }) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-3xl border border-border bg-card", children: [
        /* @__PURE__ */ jsx("div", { className: "h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" }),
        /* @__PURE__ */ jsxs("div", { className: "-mt-12 p-6 md:p-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 md:flex-row md:items-end md:justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end", children: [
              /* @__PURE__ */ jsx("div", { className: "h-24 w-24 overflow-hidden rounded-3xl border-4 border-background bg-muted shadow-sm", children: profile?.shop_logo_url || profile?.avatar_url ? /* @__PURE__ */ jsx("img", { src: profile.shop_logo_url || profile.avatar_url || "", alt: profile.shop_name || profile.full_name || "Toko", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(Store, { className: "h-9 w-9" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: profile?.shop_name || profile?.full_name || "Toko ReVibe" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(UserRound, { className: "h-4 w-4" }),
                    profile?.full_name || "Seller ReVibe"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
                    profile?.shop_location || profile?.city || "Indonesia"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary", children: [
                products.length,
                " Produk Aktif"
              ] }),
              isSeller && user?.id === sellerId ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/profil", children: "Edit Profil Toko" }) }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl bg-accent p-5", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Tentang Toko" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground", children: profile?.shop_description || profile?.bio || "Seller belum menambahkan deskripsi toko." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Produk Toko" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Produk aktif yang dijual oleh seller ini." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
          /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada produk aktif" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Seller ini belum memiliki produk aktif yang tampil di marketplace." }),
          isSeller && user?.id === sellerId ? /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6", children: /* @__PURE__ */ jsx("a", { href: "/profil", children: "Lengkapi Profil Toko" }) }) : null
        ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: products.map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product.id)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function cleanRouteId(value) {
  const cleanValue = String(value ?? "").trim();
  if (!cleanValue) return "";
  if (cleanValue === "undefined") return "";
  if (cleanValue === "null") return "";
  if (cleanValue === "$sellerId") return "";
  if (cleanValue === ":sellerId") return "";
  return cleanValue;
}
export {
  SellerPublicProfilePage as component
};
