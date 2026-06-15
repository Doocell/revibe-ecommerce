import { jsx, jsxs } from "react/jsx-runtime";
import { N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { Store, UserRound, MessageCircle, Bell } from "lucide-react";
import "@tanstack/react-router";
import "react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
function SellerSettingsPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Pengaturan Seller" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pusat pengaturan akun seller dan toko." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: [
        /* @__PURE__ */ jsx(SettingCard, { title: "Profil Toko", description: "Edit nama toko, logo, lokasi, dan deskripsi toko.", href: "/dashboard/penjual/profil-toko", icon: Store }),
        /* @__PURE__ */ jsx(SettingCard, { title: "Profil Akun", description: "Edit nama, WhatsApp, foto profil, alamat, dan bio.", href: "/profil", icon: UserRound }),
        /* @__PURE__ */ jsx(SettingCard, { title: "Chat Buyer", description: "Buka halaman percakapan dengan buyer.", href: "/chat", icon: MessageCircle }),
        /* @__PURE__ */ jsx(SettingCard, { title: "Notifikasi", description: "Lihat semua notifikasi order, pembayaran, dan chat.", href: "/notifikasi", icon: Bell })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual", children: "Kembali ke Dashboard" }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function SettingCard({
  title,
  description,
  href,
  icon: Icon
}) {
  return /* @__PURE__ */ jsxs("a", { href, className: "rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-md", children: [
    /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-primary/10 p-3 text-primary inline-flex", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 font-semibold", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-muted-foreground", children: description })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerSettingsPage, {}) });
export {
  SplitComponent as component
};
