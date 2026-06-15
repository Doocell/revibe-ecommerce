import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { FileText, ArrowLeft, Loader2, RefreshCw, Printer, UserRound, Store, ShoppingBag, CreditCard, Truck, Package, MapPin, Search } from "lucide-react";
import { u as useAuth, N as Navbar, B as Button, F as Footer, s as supabase } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
function InvoicePage() {
  const {
    user,
    roles
  } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(readOrderIdFromUrl());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const isSeller = (roles ?? []).includes("seller");
  const isBuyer = (roles ?? []).includes("buyer");
  const isAdmin = (roles ?? []).includes("admin");
  async function loadInvoices() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = db.from("orders").select(`
          id,
          buyer_id,
          seller_id,
          order_status,
          payment_status,
          payment_method,
          shipping_method,
          shipping_address,
          shipping_cost,
          subtotal,
          total,
          voucher_id,
          voucher_code,
          voucher_discount,
          courier,
          tracking_number,
          shipped_at,
          created_at,
          updated_at,
          order_items(
            id,
            order_id,
            product_id,
            quantity,
            price,
            products(
              id,
              title,
              images
            )
          )
        `).order("created_at", {
        ascending: false
      });
      if (!isAdmin) {
        query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        throw new Error(error.message);
      }
      const rows = data ?? [];
      setOrders(rows);
      const profileIds = Array.from(new Set(rows.flatMap((order) => [order.buyer_id, order.seller_id]).filter((id) => Boolean(id))));
      if (profileIds.length > 0) {
        const {
          data: profiles,
          error: profileError
        } = await db.from("profiles").select("id, full_name, shop_name, whatsapp, address, city").in("id", profileIds);
        if (profileError) {
          console.error("[Invoice Profile Load Error]", profileError);
          setProfileMap({});
        } else {
          const nextMap = {};
          (profiles ?? []).forEach((profile) => {
            nextMap[profile.id] = profile;
          });
          setProfileMap(nextMap);
        }
      } else {
        setProfileMap({});
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat invoice.");
      console.error("[Invoice Load Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadInvoices();
  }, [user?.id, isAdmin]);
  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => {
      const buyer = profileMap[order.buyer_id];
      const seller = order.seller_id ? profileMap[order.seller_id] : null;
      const productText = (order.order_items ?? []).map((item) => {
        const product = getOrderItemProduct(item);
        return product?.title ?? "";
      }).join(" ");
      const haystack = [order.id, order.order_status, order.payment_status, order.payment_method, order.shipping_method, order.courier, order.tracking_number, order.shipping_address, order.voucher_code, order.voucher_discount, buyer?.full_name, buyer?.shop_name, seller?.full_name, seller?.shop_name, productText].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [orders, search, profileMap]);
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((order) => order.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);
  function openInvoice(orderId) {
    setSelectedOrderId(orderId);
    window.history.pushState(null, "", `/invoice?order=${orderId}`);
    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, 50);
  }
  function closeInvoice() {
    setSelectedOrderId("");
    window.history.pushState(null, "", "/invoice");
  }
  if (!user?.id) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(FileText, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Invoice ReVibe" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login untuk melihat invoice pesanan." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login Pembeli" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/login/penjual", children: "Login Penjual" }) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("style", { children: printStyles }),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "no-print flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Invoice / Bukti Pesanan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Lihat dan cetak bukti transaksi pesanan ReVibe, termasuk voucher dan diskon jika digunakan." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          selectedOrder ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: closeInvoice, children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Semua Invoice"
          ] }) : null,
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadInvoices, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: isSeller ? "/dashboard/penjual" : "/dashboard/pembeli", children: "Kembali Dashboard" }) })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : selectedOrder ? /* @__PURE__ */ jsx(InvoiceDetail, { order: selectedOrder, buyer: profileMap[selectedOrder.buyer_id] ?? null, seller: selectedOrder.seller_id ? profileMap[selectedOrder.seller_id] ?? null : null, viewerRole: isSeller ? "seller" : isBuyer ? "buyer" : "admin", onBack: closeInvoice }) : /* @__PURE__ */ jsx(InvoiceList, { orders: filteredOrders, profileMap, search, onSearchChange: setSearch, onOpenInvoice: openInvoice })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function InvoiceList({
  orders,
  profileMap,
  search,
  onSearchChange,
  onOpenInvoice
}) {
  return /* @__PURE__ */ jsxs("div", { className: "no-print mt-8 rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Daftar Invoice" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pilih pesanan untuk melihat invoice dan mencetak bukti transaksi." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
        orders.length,
        " invoice"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-5", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => onSearchChange(event.target.value), placeholder: "Cari order ID, produk, buyer, seller, resi, voucher, status...", className: "pl-9" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: orders.length === 0 ? /* @__PURE__ */ jsx(EmptyInvoiceList, {}) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: orders.map((order) => {
      const buyer = profileMap[order.buyer_id];
      const seller = order.seller_id ? profileMap[order.seller_id] : null;
      const firstItem = order.order_items?.[0];
      const firstProduct = firstItem ? getOrderItemProduct(firstItem) : null;
      const voucherDiscount = getVoucherDiscount(order);
      return /* @__PURE__ */ jsx("article", { className: "rounded-2xl border border-border bg-background p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold", children: order.id })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [
            "Dibuat:",
            " ",
            new Date(order.created_at).toLocaleString("id-ID")
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm md:grid-cols-3", children: [
            /* @__PURE__ */ jsx(InfoLine, { label: "Buyer", value: profileDisplayName(buyer, "Buyer") }),
            /* @__PURE__ */ jsx(InfoLine, { label: "Seller", value: profileDisplayName(seller, "Seller") }),
            /* @__PURE__ */ jsx(InfoLine, { label: "Produk", value: firstProduct ? `${firstProduct.title}${order.order_items.length > 1 ? ` +${order.order_items.length - 1} lainnya` : ""}` : "-" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: orderStatusClass(order.order_status), children: orderStatusLabel(order.order_status) }),
            /* @__PURE__ */ jsx("span", { className: paymentStatusClass(order.payment_status), children: paymentStatusLabel(order.payment_status) }),
            order.voucher_code || voucherDiscount > 0 ? /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700", children: [
              "Voucher ",
              order.voucher_code || "Terpakai"
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-left lg:text-right", children: [
          voucherDiscount > 0 ? /* @__PURE__ */ jsxs("div", { className: "mb-2 text-sm text-green-700", children: [
            "Diskon Voucher: -",
            formatIDR(voucherDiscount)
          ] }) : null,
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: formatIDR(getOrderTotal(order)) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", onClick: () => onOpenInvoice(order.id), className: "mt-4 gradient-brand text-white", children: [
            /* @__PURE__ */ jsx(FileText, { className: "mr-2 h-4 w-4" }),
            "Lihat Invoice"
          ] })
        ] })
      ] }) }, order.id);
    }) }) })
  ] });
}
function InvoiceDetail({
  order,
  buyer,
  seller,
  viewerRole,
  onBack
}) {
  const subtotal = getOrderSubtotal(order);
  const shippingCost = Number(order.shipping_cost ?? 0);
  const voucherDiscount = getVoucherDiscount(order);
  const total = getOrderTotal(order);
  const hasVoucher = Boolean(order.voucher_code) || voucherDiscount > 0;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "no-print mt-8 flex flex-wrap justify-between gap-3", children: [
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: onBack, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Kembali ke Daftar Invoice"
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", onClick: () => window.print(), className: "gradient-brand text-white", children: [
        /* @__PURE__ */ jsx(Printer, { className: "mr-2 h-4 w-4" }),
        "Print / Save PDF"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("article", { className: "invoice-paper mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm print:shadow-none", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
            /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
            "Invoice ReVibe"
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl font-bold", children: "Bukti Pesanan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Dokumen ini adalah bukti transaksi marketplace ReVibe." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-left md:text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Order ID" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 max-w-md break-all font-mono text-sm font-semibold", children: order.id }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 text-sm text-muted-foreground", children: [
            "Tanggal: ",
            new Date(order.created_at).toLocaleString("id-ID")
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
            "Dicetak: ",
            (/* @__PURE__ */ new Date()).toLocaleString("id-ID")
          ] })
        ] })
      ] }),
      hasVoucher ? /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-green-300 bg-green-50 p-4 text-green-900", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Voucher Digunakan" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-2 text-sm md:grid-cols-3", children: [
          /* @__PURE__ */ jsx(InfoLine, { label: "Kode Voucher", value: order.voucher_code || "-" }),
          /* @__PURE__ */ jsx(InfoLine, { label: "Diskon Voucher", value: `- ${formatIDR(voucherDiscount)}` }),
          /* @__PURE__ */ jsx(InfoLine, { label: "Total Setelah Diskon", value: formatIDR(total) })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(PartyCard, { icon: /* @__PURE__ */ jsx(UserRound, { className: "h-5 w-5 text-primary" }), title: "Buyer", name: profileDisplayName(buyer, "Buyer"), phone: buyer?.whatsapp ?? null, address: buildProfileAddress(buyer) }),
        /* @__PURE__ */ jsx(PartyCard, { icon: /* @__PURE__ */ jsx(Store, { className: "h-5 w-5 text-primary" }), title: "Seller", name: profileDisplayName(seller, "Seller"), phone: seller?.whatsapp ?? null, address: buildProfileAddress(seller) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsx(InvoiceInfoCard, { icon: /* @__PURE__ */ jsx(ShoppingBag, { className: "h-5 w-5 text-primary" }), label: "Status Order", value: orderStatusLabel(order.order_status) }),
        /* @__PURE__ */ jsx(InvoiceInfoCard, { icon: /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5 text-primary" }), label: "Status Bayar", value: paymentStatusLabel(order.payment_status) }),
        /* @__PURE__ */ jsx(InvoiceInfoCard, { icon: /* @__PURE__ */ jsx(Truck, { className: "h-5 w-5 text-primary" }), label: "Pengiriman", value: order.shipping_method || "-" }),
        /* @__PURE__ */ jsx(InvoiceInfoCard, { icon: /* @__PURE__ */ jsx(Package, { className: "h-5 w-5 text-primary" }), label: "Dilihat Sebagai", value: viewerRoleLabel(viewerRole) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 overflow-hidden rounded-2xl border border-border", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-accent px-4 py-3 font-semibold", children: "Detail Produk" }),
        /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: (order.order_items ?? []).map((item) => {
          const product = getOrderItemProduct(item);
          const image = product?.images?.[0] ?? "";
          const itemPrice = Number(item.price ?? 0);
          const itemQuantity = Number(item.quantity ?? 0);
          const itemTotal = itemPrice * itemQuantity;
          return /* @__PURE__ */ jsxs("div", { className: "grid gap-4 p-4 md:grid-cols-[72px_1fr_auto]", children: [
            /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "h-[72px] w-[72px] overflow-hidden rounded-xl bg-muted", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: product?.title ?? "Produk", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "font-semibold hover:text-primary", children: product?.title ?? "Produk" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
                "Product ID: ",
                item.product_id
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [
                itemQuantity,
                " x ",
                formatIDR(itemPrice)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-left md:text-right", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Subtotal" }),
              /* @__PURE__ */ jsx("div", { className: "font-bold", children: formatIDR(itemTotal) })
            ] })
          ] }, item.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-[1fr_360px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-green-100 p-4 text-green-950", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
              "Alamat Pengiriman"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-green-900", children: order.shipping_address || "-" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-purple-200 bg-purple-50 p-4 text-purple-950", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
              /* @__PURE__ */ jsx(Truck, { className: "h-4 w-4" }),
              "Detail Pengiriman"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 text-sm md:grid-cols-3", children: [
              /* @__PURE__ */ jsx(InfoLine, { label: "Kurir", value: order.courier || "-" }),
              /* @__PURE__ */ jsx(InfoLine, { label: "Nomor Resi", value: order.tracking_number || "-" }),
              /* @__PURE__ */ jsx(InfoLine, { label: "Tanggal Kirim", value: order.shipped_at ? new Date(order.shipped_at).toLocaleString("id-ID") : "-" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-4 text-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Catatan" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Invoice ini dibuat otomatis dari data pesanan. Jika terdapat perbedaan data, gunakan data terbaru di dashboard ReVibe." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "h-fit rounded-2xl border border-border p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Ringkasan Pembayaran" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3 text-sm", children: [
            /* @__PURE__ */ jsx(SummaryRow, { label: "Subtotal Produk", value: formatIDR(subtotal) }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Ongkir", value: formatIDR(shippingCost) }),
            hasVoucher ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(SummaryRow, { label: "Kode Voucher", value: order.voucher_code || "-" }),
              /* @__PURE__ */ jsx(SummaryRow, { label: "Diskon Voucher", value: `- ${formatIDR(voucherDiscount)}` })
            ] }) : /* @__PURE__ */ jsx(SummaryRow, { label: "Voucher", value: "Tidak digunakan" }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Metode Bayar", value: paymentMethodLabel(order.payment_method) }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Metode Kirim", value: order.shipping_method || "-" }),
            /* @__PURE__ */ jsx("div", { className: "border-t border-border pt-3", children: /* @__PURE__ */ jsx(SummaryRow, { label: "Total Akhir", value: formatIDR(total), strong: true }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-4 border-t border-border pt-6 text-sm md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "ReVibe Marketplace" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Marketplace barang preloved Indonesia." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-left md:text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Status Dokumen" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Dibuat otomatis dan valid berdasarkan data order." })
        ] })
      ] })
    ] })
  ] });
}
function PartyCard({
  icon,
  title,
  name,
  phone,
  address
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [
      icon,
      title
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 font-bold", children: name }),
    phone ? /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: phone }) : null,
    /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-muted-foreground", children: address || "-" })
  ] });
}
function InvoiceInfoCard({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border p-4", children: [
    icon,
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 font-semibold", children: value })
  ] });
}
function SummaryRow({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsx("span", { className: strong ? "font-semibold" : "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: strong ? "text-xl font-bold text-primary" : "font-medium", children: value })
  ] });
}
function InfoLine({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-medium", children: value || "-" })
  ] });
}
function EmptyInvoiceList() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(FileText, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Belum ada invoice" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Invoice akan muncul setelah ada pesanan." }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Mulai Belanja" }) })
  ] });
}
function readOrderIdFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("order") ?? "";
}
function getOrderItemProduct(item) {
  if (Array.isArray(item.products)) {
    return item.products[0] ?? null;
  }
  return item.products ?? null;
}
function calculateItemsSubtotal(order) {
  return (order.order_items ?? []).reduce((sum, item) => {
    return sum + Number(item.price ?? 0) * Number(item.quantity ?? 0);
  }, 0);
}
function getOrderSubtotal(order) {
  const savedSubtotal = Number(order.subtotal ?? 0);
  if (Number.isFinite(savedSubtotal) && savedSubtotal > 0) {
    return savedSubtotal;
  }
  return calculateItemsSubtotal(order);
}
function getVoucherDiscount(order) {
  const discount = Number(order.voucher_discount ?? 0);
  if (!Number.isFinite(discount) || discount < 0) return 0;
  return discount;
}
function getOrderTotal(order) {
  const savedTotal = Number(order.total ?? 0);
  if (Number.isFinite(savedTotal) && savedTotal > 0) {
    return savedTotal;
  }
  const subtotal = getOrderSubtotal(order);
  const shippingCost = Number(order.shipping_cost ?? 0);
  const voucherDiscount = getVoucherDiscount(order);
  return Math.max(subtotal + shippingCost - voucherDiscount, 0);
}
function buildProfileAddress(profile) {
  if (!profile) return "-";
  const address = profile.address?.trim() ?? "";
  const city = profile.city?.trim() ?? "";
  if (address && city) return `${address}, ${city}`;
  if (address) return address;
  if (city) return city;
  return "-";
}
function profileDisplayName(profile, fallback) {
  if (!profile) return fallback;
  return profile.shop_name || profile.full_name || fallback;
}
function viewerRoleLabel(role) {
  const labels = {
    buyer: "Pembeli",
    seller: "Penjual",
    admin: "Admin"
  };
  return labels[role];
}
function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}
function orderStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    diproses_penjual: "Diproses Penjual",
    diproses: "Diproses",
    dikirim: "Dikirim",
    shipped: "Dikirim",
    delivered: "Diterima",
    pesanan_diterima: "Pesanan Diterima",
    diterima: "Diterima",
    selesai: "Selesai",
    completed: "Selesai",
    dibatalkan: "Dibatalkan",
    cancelled: "Dibatalkan"
  };
  return labels[normalizeStatus(status)] ?? status ?? "-";
}
function paymentStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    pending: "Menunggu Pembayaran",
    dibayar: "Dibayar",
    paid: "Dibayar",
    settlement: "Dibayar",
    success: "Dibayar",
    gagal: "Gagal",
    failed: "Gagal",
    dikembalikan: "Dikembalikan",
    refunded: "Dikembalikan"
  };
  return labels[normalizeStatus(status)] ?? status ?? "-";
}
function paymentMethodLabel(method) {
  const labels = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    bank_transfer: "Transfer Bank",
    qris: "QRIS"
  };
  return labels[normalizeStatus(method)] ?? method ?? "-";
}
function orderStatusClass(status) {
  const safeStatus = normalizeStatus(status);
  if (safeStatus === "selesai" || safeStatus === "pesanan_diterima" || safeStatus === "diterima" || safeStatus === "completed" || safeStatus === "delivered") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (safeStatus === "dikirim" || safeStatus === "shipped") {
    return "rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700";
  }
  if (safeStatus === "dibatalkan" || safeStatus === "cancelled") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  if (safeStatus === "diproses_penjual" || safeStatus === "diproses") {
    return "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700";
  }
  return "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary";
}
function paymentStatusClass(status) {
  const safeStatus = normalizeStatus(status);
  if (safeStatus === "dibayar" || safeStatus === "paid" || safeStatus === "settlement" || safeStatus === "success") {
    return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700";
  }
  if (safeStatus === "gagal" || safeStatus === "failed") {
    return "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700";
  }
  return "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
const printStyles = `
@media print {
  body {
    background: #ffffff !important;
  }

  .no-print,
  nav,
  footer {
    display: none !important;
  }

  .container {
    max-width: 100% !important;
    padding: 0 !important;
  }

  .invoice-paper {
    margin: 0 !important;
    border: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  a {
    color: inherit !important;
    text-decoration: none !important;
  }
}
`;
export {
  InvoicePage as component
};
