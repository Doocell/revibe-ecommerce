import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Toaster as Toaster$1 } from "sonner";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const appCss = "/assets/styles-DDuhnz3K.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$D = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ReVibe — Marketplace Preloved Indonesia" },
      { name: "description", content: "ReVibe adalah marketplace barang preloved Indonesia. Jual beli pakaian, tas, sepatu, elektronik & buku bekas layak pakai dengan aman dan terpercaya." },
      { name: "author", content: "ReVibe" },
      { property: "og:title", content: "ReVibe — Marketplace Preloved Indonesia" },
      { property: "og:description", content: "Belanja & jual barang preloved berkualitas dengan aman dan terpercaya." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$D.useRouteContext();
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center" })
  ] });
}
const $$splitComponentImporter$C = () => import("./wishlist-DTgwmvZG.js");
const Route$C = createFileRoute("/wishlist")({
  component: lazyRouteComponent($$splitComponentImporter$C, "component")
});
const $$splitComponentImporter$B = () => import("./ulasan-BI8RUQcX.js");
const Route$B = createFileRoute("/ulasan")({
  component: lazyRouteComponent($$splitComponentImporter$B, "component")
});
const $$splitComponentImporter$A = () => import("./tracking-CZo24Ytq.js");
const Route$A = createFileRoute("/tracking")({
  component: lazyRouteComponent($$splitComponentImporter$A, "component")
});
const $$splitComponentImporter$z = () => import("./tentang-BUtVXW_1.js");
const Route$z = createFileRoute("/tentang")({
  component: lazyRouteComponent($$splitComponentImporter$z, "component"),
  head: () => ({
    meta: [{
      title: "Tentang Kami — ReVibe"
    }, {
      name: "description",
      content: "Tentang ReVibe, marketplace barang preloved Indonesia yang aman, mudah, dan terpercaya."
    }]
  })
});
const $$splitComponentImporter$y = () => import("./profil-Dx_x68Jb.js");
const Route$y = createFileRoute("/profil")({
  component: lazyRouteComponent($$splitComponentImporter$y, "component")
});
const $$splitComponentImporter$x = () => import("./produk-D8hJI61D.js");
const Route$x = createFileRoute("/produk")({
  component: lazyRouteComponent($$splitComponentImporter$x, "component"),
  head: () => ({
    meta: [{
      title: "Produk Preloved — ReVibe"
    }, {
      name: "description",
      content: "Jelajahi semua produk preloved di ReVibe: pakaian, tas, sepatu, elektronik, buku, aksesoris."
    }]
  })
});
const $$splitComponentImporter$w = () => import("./notifikasi-D_TT7JJ5.js");
const Route$w = createFileRoute("/notifikasi")({
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitComponentImporter$v = () => import("./komplain-DwqFJlRx.js");
const Route$v = createFileRoute("/komplain")({
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./keranjang-BnAbXQpB.js");
const Route$u = createFileRoute("/keranjang")({
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./kategori-B-OI-__B.js");
const Route$t = createFileRoute("/kategori")({
  component: lazyRouteComponent($$splitComponentImporter$t, "component"),
  head: () => ({
    meta: [{
      title: "Kategori — ReVibe"
    }, {
      name: "description",
      content: "Telusuri seluruh kategori barang preloved di ReVibe."
    }]
  })
});
const $$splitComponentImporter$s = () => import("./invoice-DP6fLnms.js");
const Route$s = createFileRoute("/invoice")({
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./detail-produk-NL3BF1Gf.js");
const Route$r = createFileRoute("/detail-produk")({
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./checkout-9j8gkuMZ.js");
const Route$q = createFileRoute("/checkout")({
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./chat-BizqdoNN.js");
const Route$p = createFileRoute("/chat")({
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./alamat-EfPd_vGM.js");
const Route$o = createFileRoute("/alamat")({
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./index-DhybF4P0.js");
const Route$n = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./voucher.penjual-CpCgilsC.js");
const Route$m = createFileRoute("/voucher/penjual")({
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./toko._sellerId-C9SeVDXR.js");
const Route$l = createFileRoute("/toko/$sellerId")({
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./register.penjual-B6o0fQ7O.js");
const Route$k = createFileRoute("/register/penjual")({
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./register.pembeli-tfpCB96X.js");
const Route$j = createFileRoute("/register/pembeli")({
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./produk._id-DlnW3cS2.js");
const Route$i = createFileRoute("/produk/$id")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./login.penjual-CvOzjVA_.js");
const Route$h = createFileRoute("/login/penjual")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./login.pembeli-D5GZV4Cv.js");
const Route$g = createFileRoute("/login/pembeli")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./komplain.penjual-nPYBC1Px.js");
const Route$f = createFileRoute("/komplain/penjual")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./dashboard.penjual-D7t-zKo2.js");
const Route$e = createFileRoute("/dashboard/penjual")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./dashboard.pembeli-5Nb6qlUJ.js");
const Route$d = createFileRoute("/dashboard/pembeli")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./dashboard.admin-D3sjHaEa.js");
const Route$c = createFileRoute("/dashboard/admin")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./admin.login-lsdBlZMg.js");
const Route$b = createFileRoute("/admin/login")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./dashboard.penjual.profil-toko-Dj39MDKZ.js");
const Route$a = createFileRoute("/dashboard/penjual/profil-toko")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./dashboard.penjual.produk-BPuACmsN.js");
const Route$9 = createFileRoute("/dashboard/penjual/produk")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./dashboard.penjual.pesanan-DzR6V3oE.js");
const Route$8 = createFileRoute("/dashboard/penjual/pesanan")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./dashboard.penjual.pengaturan-CGyCwN6q.js");
const Route$7 = createFileRoute("/dashboard/penjual/pengaturan")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./dashboard.penjual.laporan-BKwkSRN6.js");
const Route$6 = createFileRoute("/dashboard/penjual/laporan")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard.admin_.users-BkN9ll2S.js");
const Route$5 = createFileRoute("/dashboard/admin_/users")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboard.admin_.transaksi-BoYqwSyz.js");
const Route$4 = createFileRoute("/dashboard/admin_/transaksi")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./dashboard.admin_.seller-BinBgIeQ.js");
const Route$3 = createFileRoute("/dashboard/admin_/seller")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboard.admin_.laporan-D7FhffWH.js");
const Route$2 = createFileRoute("/dashboard/admin_/laporan")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboard.admin_.chat-B1G2WjYx.js");
const Route$1 = createFileRoute("/dashboard/admin_/chat")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./dashboard.penjual.produk.tambah-DdufiboC.js");
const Route = createFileRoute("/dashboard/penjual/produk/tambah")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const WishlistRoute = Route$C.update({
  id: "/wishlist",
  path: "/wishlist",
  getParentRoute: () => Route$D
});
const UlasanRoute = Route$B.update({
  id: "/ulasan",
  path: "/ulasan",
  getParentRoute: () => Route$D
});
const TrackingRoute = Route$A.update({
  id: "/tracking",
  path: "/tracking",
  getParentRoute: () => Route$D
});
const TentangRoute = Route$z.update({
  id: "/tentang",
  path: "/tentang",
  getParentRoute: () => Route$D
});
const ProfilRoute = Route$y.update({
  id: "/profil",
  path: "/profil",
  getParentRoute: () => Route$D
});
const ProdukRoute = Route$x.update({
  id: "/produk",
  path: "/produk",
  getParentRoute: () => Route$D
});
const NotifikasiRoute = Route$w.update({
  id: "/notifikasi",
  path: "/notifikasi",
  getParentRoute: () => Route$D
});
const KomplainRoute = Route$v.update({
  id: "/komplain",
  path: "/komplain",
  getParentRoute: () => Route$D
});
const KeranjangRoute = Route$u.update({
  id: "/keranjang",
  path: "/keranjang",
  getParentRoute: () => Route$D
});
const KategoriRoute = Route$t.update({
  id: "/kategori",
  path: "/kategori",
  getParentRoute: () => Route$D
});
const InvoiceRoute = Route$s.update({
  id: "/invoice",
  path: "/invoice",
  getParentRoute: () => Route$D
});
const DetailProdukRoute = Route$r.update({
  id: "/detail-produk",
  path: "/detail-produk",
  getParentRoute: () => Route$D
});
const CheckoutRoute = Route$q.update({
  id: "/checkout",
  path: "/checkout",
  getParentRoute: () => Route$D
});
const ChatRoute = Route$p.update({
  id: "/chat",
  path: "/chat",
  getParentRoute: () => Route$D
});
const AlamatRoute = Route$o.update({
  id: "/alamat",
  path: "/alamat",
  getParentRoute: () => Route$D
});
const IndexRoute = Route$n.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$D
});
const VoucherPenjualRoute = Route$m.update({
  id: "/voucher/penjual",
  path: "/voucher/penjual",
  getParentRoute: () => Route$D
});
const TokoSellerIdRoute = Route$l.update({
  id: "/toko/$sellerId",
  path: "/toko/$sellerId",
  getParentRoute: () => Route$D
});
const RegisterPenjualRoute = Route$k.update({
  id: "/register/penjual",
  path: "/register/penjual",
  getParentRoute: () => Route$D
});
const RegisterPembeliRoute = Route$j.update({
  id: "/register/pembeli",
  path: "/register/pembeli",
  getParentRoute: () => Route$D
});
const ProdukIdRoute = Route$i.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => ProdukRoute
});
const LoginPenjualRoute = Route$h.update({
  id: "/login/penjual",
  path: "/login/penjual",
  getParentRoute: () => Route$D
});
const LoginPembeliRoute = Route$g.update({
  id: "/login/pembeli",
  path: "/login/pembeli",
  getParentRoute: () => Route$D
});
const KomplainPenjualRoute = Route$f.update({
  id: "/penjual",
  path: "/penjual",
  getParentRoute: () => KomplainRoute
});
const DashboardPenjualRoute = Route$e.update({
  id: "/dashboard/penjual",
  path: "/dashboard/penjual",
  getParentRoute: () => Route$D
});
const DashboardPembeliRoute = Route$d.update({
  id: "/dashboard/pembeli",
  path: "/dashboard/pembeli",
  getParentRoute: () => Route$D
});
const DashboardAdminRoute = Route$c.update({
  id: "/dashboard/admin",
  path: "/dashboard/admin",
  getParentRoute: () => Route$D
});
const AdminLoginRoute = Route$b.update({
  id: "/admin/login",
  path: "/admin/login",
  getParentRoute: () => Route$D
});
const DashboardPenjualProfilTokoRoute = Route$a.update({
  id: "/profil-toko",
  path: "/profil-toko",
  getParentRoute: () => DashboardPenjualRoute
});
const DashboardPenjualProdukRoute = Route$9.update({
  id: "/produk",
  path: "/produk",
  getParentRoute: () => DashboardPenjualRoute
});
const DashboardPenjualPesananRoute = Route$8.update({
  id: "/pesanan",
  path: "/pesanan",
  getParentRoute: () => DashboardPenjualRoute
});
const DashboardPenjualPengaturanRoute = Route$7.update({
  id: "/pengaturan",
  path: "/pengaturan",
  getParentRoute: () => DashboardPenjualRoute
});
const DashboardPenjualLaporanRoute = Route$6.update({
  id: "/laporan",
  path: "/laporan",
  getParentRoute: () => DashboardPenjualRoute
});
const DashboardAdminUsersRoute = Route$5.update({
  id: "/dashboard/admin_/users",
  path: "/dashboard/admin/users",
  getParentRoute: () => Route$D
});
const DashboardAdminTransaksiRoute = Route$4.update({
  id: "/dashboard/admin_/transaksi",
  path: "/dashboard/admin/transaksi",
  getParentRoute: () => Route$D
});
const DashboardAdminSellerRoute = Route$3.update({
  id: "/dashboard/admin_/seller",
  path: "/dashboard/admin/seller",
  getParentRoute: () => Route$D
});
const DashboardAdminLaporanRoute = Route$2.update({
  id: "/dashboard/admin_/laporan",
  path: "/dashboard/admin/laporan",
  getParentRoute: () => Route$D
});
const DashboardAdminChatRoute = Route$1.update({
  id: "/dashboard/admin_/chat",
  path: "/dashboard/admin/chat",
  getParentRoute: () => Route$D
});
const DashboardPenjualProdukTambahRoute = Route.update({
  id: "/tambah",
  path: "/tambah",
  getParentRoute: () => DashboardPenjualProdukRoute
});
const KomplainRouteChildren = {
  KomplainPenjualRoute
};
const KomplainRouteWithChildren = KomplainRoute._addFileChildren(
  KomplainRouteChildren
);
const ProdukRouteChildren = {
  ProdukIdRoute
};
const ProdukRouteWithChildren = ProdukRoute._addFileChildren(ProdukRouteChildren);
const DashboardPenjualProdukRouteChildren = {
  DashboardPenjualProdukTambahRoute
};
const DashboardPenjualProdukRouteWithChildren = DashboardPenjualProdukRoute._addFileChildren(
  DashboardPenjualProdukRouteChildren
);
const DashboardPenjualRouteChildren = {
  DashboardPenjualLaporanRoute,
  DashboardPenjualPengaturanRoute,
  DashboardPenjualPesananRoute,
  DashboardPenjualProdukRoute: DashboardPenjualProdukRouteWithChildren,
  DashboardPenjualProfilTokoRoute
};
const DashboardPenjualRouteWithChildren = DashboardPenjualRoute._addFileChildren(DashboardPenjualRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AlamatRoute,
  ChatRoute,
  CheckoutRoute,
  DetailProdukRoute,
  InvoiceRoute,
  KategoriRoute,
  KeranjangRoute,
  KomplainRoute: KomplainRouteWithChildren,
  NotifikasiRoute,
  ProdukRoute: ProdukRouteWithChildren,
  ProfilRoute,
  TentangRoute,
  TrackingRoute,
  UlasanRoute,
  WishlistRoute,
  AdminLoginRoute,
  DashboardAdminRoute,
  DashboardPembeliRoute,
  DashboardPenjualRoute: DashboardPenjualRouteWithChildren,
  LoginPembeliRoute,
  LoginPenjualRoute,
  RegisterPembeliRoute,
  RegisterPenjualRoute,
  TokoSellerIdRoute,
  VoucherPenjualRoute,
  DashboardAdminChatRoute,
  DashboardAdminLaporanRoute,
  DashboardAdminSellerRoute,
  DashboardAdminTransaksiRoute,
  DashboardAdminUsersRoute
};
const routeTree = Route$D._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$l as R,
  Route$i as a,
  router as r
};
