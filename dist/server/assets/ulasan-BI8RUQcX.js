import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquareText, Loader2, RefreshCw, Star, PackageCheck } from "lucide-react";
import { u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { b as getReviewContext, c as getReviewableItems, s as saveProductReview } from "./reviews-CeiujS0R.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
function ReviewPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [context, setContext] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const searchParams = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        orderId: "",
        productId: "",
        orderItemId: ""
      };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      orderId: params.get("order") ?? "",
      productId: params.get("product") ?? "",
      orderItemId: params.get("item") ?? ""
    };
  }, []);
  const isFormMode = Boolean(searchParams.orderId && searchParams.productId);
  async function loadReviewPage() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isFormMode) {
        const reviewContext = await getReviewContext({
          buyerId: user.id,
          orderId: searchParams.orderId,
          productId: searchParams.productId,
          orderItemId: searchParams.orderItemId
        });
        setContext(reviewContext);
        if (reviewContext.existingReview) {
          setRating(reviewContext.existingReview.rating);
          setComment(reviewContext.existingReview.comment ?? "");
        } else {
          setRating(5);
          setComment("");
        }
        setItems([]);
      } else {
        const rows = await getReviewableItems(user.id);
        setItems(rows);
        setContext(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat halaman ulasan.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadReviewPage();
  }, [user?.id]);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli.");
      return;
    }
    if (!context) {
      toast.error("Data ulasan tidak valid.");
      return;
    }
    setSaving(true);
    try {
      await saveProductReview({
        buyerId: user.id,
        orderId: context.orderId,
        orderItemId: context.orderItemId,
        productId: context.productId,
        sellerId: context.sellerId,
        rating,
        comment
      });
      toast.success("Ulasan berhasil disimpan.");
      window.location.href = `/detail-produk?id=${context.productId}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan ulasan.");
    } finally {
      setSaving(false);
    }
  }
  if (!user?.id) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(MessageSquareText, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Ulasan Produk" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login sebagai pembeli untuk memberi ulasan." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login Pembeli" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Ulasan Produk" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Berikan rating setelah pesanan diterima atau selesai." })
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadReviewPage, disabled: loading, children: [
          loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
          "Refresh"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : isFormMode ? context ? /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[420px_1fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl bg-muted", children: context.productImage ? /* @__PURE__ */ jsx("img", { src: context.productImage, alt: context.productTitle, className: "aspect-square w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex aspect-square items-center justify-center text-muted-foreground", children: "Tidak ada foto" }) }),
          /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: context.productTitle }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
            "Order ID: ",
            context.orderId
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary", children: [
            "Status pesanan sudah bisa diulas:",
            " ",
            /* @__PURE__ */ jsx("b", { children: orderStatusLabel(context.orderStatus) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: context.existingReview ? "Edit Ulasan" : "Beri Ulasan" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Rating akan tampil di halaman detail produk dan kartu produk." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Rating Produk" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: [1, 2, 3, 4, 5].map((value) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setRating(value), className: `rounded-xl border px-4 py-3 transition ${rating >= value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`, children: /* @__PURE__ */ jsx(Star, { className: `h-6 w-6 ${rating >= value ? "fill-current" : ""}` }) }, value)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [
              "Rating dipilih: ",
              rating,
              " dari 5"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsx("label", { className: "font-medium", children: "Komentar Ulasan" }),
            /* @__PURE__ */ jsx(Textarea, { value: comment, onChange: (event) => setComment(event.target.value), rows: 6, placeholder: "Tulis pengalaman kamu terhadap produk ini.", className: "mt-3" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-end gap-2", children: [
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/ulasan", children: "Kembali" }) }),
            /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(MessageSquareText, { className: "mr-2 h-4 w-4" }),
              "Simpan Ulasan"
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsx(EmptyState, { title: "Data ulasan tidak ditemukan", description: "Pastikan pesanan sudah diterima/selesai dan produk ada dalam pesanan." }) : /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Produk yang Bisa Diulas" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Produk dari pesanan yang sudah diterima atau selesai akan muncul di sini." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: items.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "Belum ada produk yang bisa diulas", description: "Pastikan pesanan sudah kamu tandai diterima atau statusnya sudah selesai." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: items.map((item) => /* @__PURE__ */ jsx(ReviewableItemCard, { item }, item.orderItemId)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function ReviewableItemCard({
  item
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-background p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted", children: item.productImage ? /* @__PURE__ */ jsx("img", { src: item.productImage, alt: item.productTitle, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("h3", { className: "line-clamp-2 font-semibold", children: item.productTitle }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Order: ",
          item.orderId
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Status: ",
          orderStatusLabel(item.orderStatus)
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Jumlah: ",
          item.quantity
        ] }),
        item.existingReview ? /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-1 text-sm text-primary", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-current" }),
          item.existingReview.rating,
          "/5 — Sudah diulas"
        ] }) : /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-muted-foreground", children: "Belum diulas" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: `/ulasan?order=${item.orderId}&product=${item.productId}&item=${item.orderItemId}`, children: item.existingReview ? "Edit Ulasan" : "Beri Ulasan" }) }) })
  ] });
}
function EmptyState({
  title,
  description
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(PackageCheck, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: description }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/pembeli", children: "Kembali ke Dashboard Pembeli" }) })
  ] });
}
function orderStatusLabel(status) {
  const labels = {
    selesai: "Selesai",
    pesanan_diterima: "Pesanan Diterima",
    diterima: "Diterima",
    completed: "Selesai",
    delivered: "Diterima",
    dikirim: "Dikirim",
    diproses_penjual: "Diproses Penjual",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    dibatalkan: "Dibatalkan"
  };
  return labels[String(status ?? "")] ?? status ?? "-";
}
export {
  ReviewPage as component
};
