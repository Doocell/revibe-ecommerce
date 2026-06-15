import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { Loader2 } from "lucide-react";
function RoleGuard({ required, children }) {
  const { user, roles, loading } = useAuth();
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) });
  }
  if (!user) {
    const loginPath = required === "admin" ? "/admin/login" : required === "seller" ? "/login/penjual" : "/login/pembeli";
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center px-4 py-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-brand", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Silakan masuk terlebih dahulu" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Anda perlu masuk untuk mengakses halaman ini." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-5 gradient-brand text-white", children: /* @__PURE__ */ jsx(Link, { to: loginPath, children: "Masuk" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  if (!roles.includes(required)) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center px-4 py-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md rounded-2xl border border-destructive/30 bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-destructive", children: "Akses ditolak" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Akses ditolak. Anda tidak memiliki izin untuk membuka halaman ini." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", className: "mt-5", children: /* @__PURE__ */ jsx(Link, { to: "/", children: "Kembali ke beranda" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
export {
  RoleGuard as R
};
