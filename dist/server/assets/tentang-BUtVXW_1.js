import { jsxs, jsx } from "react/jsx-runtime";
import { N as Navbar, F as Footer } from "./Navbar-BfYtpR_3.js";
import { ShieldCheck, Recycle, Heart, Users } from "lucide-react";
import "@tanstack/react-router";
import "react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
function TentangPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "gradient-soft", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-16 text-center md:py-24", children: [
        /* @__PURE__ */ jsxs("h1", { className: "mx-auto max-w-3xl text-4xl font-extrabold md:text-5xl", children: [
          "Memberi kehidupan kedua pada ",
          /* @__PURE__ */ jsx("span", { className: "text-gradient-brand", children: "barang berkualitas" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-5 max-w-2xl text-muted-foreground", children: "ReVibe lahir dari satu keyakinan sederhana: barang bekas yang layak pakai pantas mendapat rumah baru, bukan tempat sampah." })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "container mx-auto grid gap-6 px-4 py-16 md:grid-cols-4", children: [{
        icon: ShieldCheck,
        t: "Aman",
        d: "Verifikasi penjual & pembayaran aman."
      }, {
        icon: Recycle,
        t: "Berkelanjutan",
        d: "Kurangi limbah, perpanjang siklus barang."
      }, {
        icon: Heart,
        t: "Mudah",
        d: "Pengalaman belanja & jualan sederhana."
      }, {
        icon: Users,
        t: "Terpercaya",
        d: "Komunitas pembeli & penjual aktif."
      }].map((v) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsx(v.icon, { className: "h-8 w-8 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: v.t }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: v.d })
      ] }, v.t)) }),
      /* @__PURE__ */ jsx("section", { className: "bg-muted/40 py-16", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto grid gap-10 px-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold", children: "Misi Kami" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "Membangun marketplace preloved Indonesia yang paling tepercaya — tempat penjual & pembeli bertemu tanpa drama, dengan harga yang adil dan dampak baik untuk lingkungan." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold", children: "Visi Kami" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "Menjadi pilihan utama keluarga Indonesia saat ingin membeli atau menjual barang preloved, sekaligus menormalkan gaya hidup berkelanjutan." })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
export {
  TentangPage as component
};
