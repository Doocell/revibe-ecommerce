import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { ShoppingBag, Clock, Package, Truck, CheckCircle2, XCircle, ArrowLeft, Loader2, RefreshCw, Search, AlertTriangle, RotateCcw } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
const RESTORE_MARKER = "[ADMIN_STOCK_RESTORED]";
const EXTENDED_ORDER_SELECT = `
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
  stock_deducted,
  stock_restored,
  stock_restored_at,
  cancel_reason,
  cancelled_at,
  courier,
  tracking_number,
  shipped_at,
  notes,
  created_at,
  updated_at,
  order_items(
    id,
    product_id,
    quantity,
    price,
    products(
      id,
      title,
      images
    )
  )
`;
const BASE_ORDER_SELECT = `
  id,
  buyer_id,
  seller_id,
  order_status,
  payment_status,
  payment_method,
  shipping_method,
  shipping_address,
  shipping_cost,
  total,
  tracking_number,
  notes,
  created_at,
  updated_at,
  order_items(
    id,
    product_id,
    quantity,
    price,
    products(
      id,
      title,
      images
    )
  )
`;
async function getAdminTransactions(filters = {}) {
  const limit = filters.limit ?? 150;
  const rawOrders = await fetchOrdersWithFallback({
    selectSql: EXTENDED_ORDER_SELECT,
    fallbackSelectSql: BASE_ORDER_SELECT,
    orderStatus: filters.orderStatus,
    paymentStatus: filters.paymentStatus,
    limit
  });
  const profileIds = Array.from(
    new Set(
      rawOrders.flatMap((order) => [order.buyer_id, order.seller_id]).filter((id) => Boolean(id))
    )
  );
  const profileMap = await getProfileMap(profileIds);
  let rows = rawOrders.map((order) => normalizeAdminTransaction(order, profileMap));
  const search = String(filters.search ?? "").trim().toLowerCase();
  if (search) {
    rows = rows.filter((order) => {
      const productText = order.order_items.map((item) => item.product_title).join(" ").toLowerCase();
      return [
        order.id,
        order.buyer_name,
        order.seller_name,
        order.tracking_number ?? "",
        order.payment_method ?? "",
        order.shipping_method ?? "",
        productText
      ].join(" ").toLowerCase().includes(search);
    });
  }
  return rows;
}
async function fetchOrdersWithFallback({
  selectSql,
  fallbackSelectSql,
  orderStatus,
  paymentStatus,
  limit
}) {
  const firstResult = await runOrderQuery({
    selectSql,
    orderStatus,
    paymentStatus,
    limit
  });
  if (!firstResult.error) {
    return firstResult.data ?? [];
  }
  if (!isMissingColumnError(firstResult.error.message)) {
    throw new Error(firstResult.error.message);
  }
  const secondResult = await runOrderQuery({
    selectSql: fallbackSelectSql,
    orderStatus,
    paymentStatus,
    limit
  });
  if (secondResult.error) {
    throw new Error(secondResult.error.message);
  }
  return secondResult.data ?? [];
}
async function runOrderQuery({
  selectSql,
  orderStatus,
  paymentStatus,
  limit
}) {
  let query = db.from("orders").select(selectSql).order("created_at", { ascending: false }).limit(limit);
  if (orderStatus) {
    query = query.eq("order_status", orderStatus);
  }
  if (paymentStatus) {
    query = query.eq("payment_status", paymentStatus);
  }
  return query;
}
async function getProfileMap(profileIds) {
  const map = /* @__PURE__ */ new Map();
  if (profileIds.length === 0) {
    return map;
  }
  const { data, error } = await db.from("profiles").select("id, full_name, shop_name").in("id", profileIds);
  if (error) {
    throw new Error(error.message);
  }
  for (const profile of data ?? []) {
    map.set(String(profile.id), {
      full_name: profile.full_name ?? null,
      shop_name: profile.shop_name ?? null
    });
  }
  return map;
}
function normalizeAdminTransaction(order, profileMap) {
  const items = Array.isArray(order.order_items) ? order.order_items.map(normalizeOrderItem) : [];
  const computedSubtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const buyerProfile = profileMap.get(String(order.buyer_id));
  const sellerProfile = profileMap.get(String(order.seller_id));
  return {
    id: String(order.id),
    buyer_id: String(order.buyer_id),
    seller_id: String(order.seller_id),
    buyer_name: buyerProfile?.full_name || "Buyer",
    seller_name: sellerProfile?.shop_name || sellerProfile?.full_name || "Seller",
    order_status: String(order.order_status ?? "-"),
    payment_status: String(order.payment_status ?? "-"),
    payment_method: order.payment_method ?? null,
    shipping_method: order.shipping_method ?? null,
    shipping_address: order.shipping_address ?? null,
    shipping_cost: Number(order.shipping_cost ?? 0),
    subtotal: Number(order.subtotal ?? computedSubtotal),
    total: Number(order.total ?? computedSubtotal + Number(order.shipping_cost ?? 0)),
    stock_deducted: Boolean(order.stock_deducted ?? true),
    stock_restored: Boolean(order.stock_restored) || String(order.notes ?? "").includes(RESTORE_MARKER),
    stock_restored_at: order.stock_restored_at ?? null,
    cancel_reason: order.cancel_reason ?? getCancelReasonFromNotes(order.notes),
    cancelled_at: order.cancelled_at ?? null,
    courier: order.courier ?? null,
    tracking_number: order.tracking_number ?? null,
    shipped_at: order.shipped_at ?? null,
    notes: order.notes ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at ?? null,
    order_items: items
  };
}
function normalizeOrderItem(item) {
  const product = Array.isArray(item.products) ? item.products[0] ?? null : item.products ?? null;
  const quantity = Number(item.quantity ?? 0);
  const price = Number(item.price ?? 0);
  return {
    id: String(item.id),
    product_id: String(item.product_id),
    product_title: product?.title ?? "Produk",
    product_image: Array.isArray(product?.images) ? product.images[0] ?? null : null,
    quantity,
    price,
    line_total: quantity * price
  };
}
async function updateAdminOrderStatus({
  orderId,
  orderStatus
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }
  const { error } = await db.from("orders").update({
    order_status: orderStatus,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", orderId);
  if (error) {
    throw new Error(error.message);
  }
}
async function updateAdminPaymentStatus({
  orderId,
  paymentStatus
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }
  const candidates = paymentStatus === "dibayar" ? ["dibayar", "pembayaran_berhasil"] : [paymentStatus];
  let lastError = null;
  for (const candidate of candidates) {
    const { error } = await db.from("orders").update({
      payment_status: candidate,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", orderId);
    if (!error) {
      return;
    }
    lastError = error.message;
  }
  throw new Error(lastError ?? "Gagal memperbarui status pembayaran.");
}
async function cancelAdminTransaction({
  orderId,
  reason
}) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }
  const cleanReason = reason.trim() || "Dibatalkan oleh admin.";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const extendedPayload = {
    order_status: "dibatalkan",
    cancel_reason: cleanReason,
    cancelled_at: now,
    updated_at: now
  };
  const firstResult = await db.from("orders").update(extendedPayload).eq("id", orderId);
  if (!firstResult.error) {
    return;
  }
  if (!isMissingColumnError(firstResult.error.message)) {
    throw new Error(firstResult.error.message);
  }
  const order = await getBasicOrder(orderId);
  const notes = appendAdminNote(order?.notes ?? null, `Pembatalan: ${cleanReason}`);
  const { error } = await db.from("orders").update({
    order_status: "dibatalkan",
    notes,
    updated_at: now
  }).eq("id", orderId);
  if (error) {
    throw new Error(error.message);
  }
}
async function restoreAdminTransactionStock(orderId) {
  if (!orderId) {
    throw new Error("ID order tidak valid.");
  }
  const order = await getOrderForStockRestore(orderId);
  if (!order) {
    throw new Error("Transaksi tidak ditemukan.");
  }
  if (Boolean(order.stock_restored) || String(order.notes ?? "").includes(RESTORE_MARKER)) {
    throw new Error("Stok transaksi ini sudah pernah dikembalikan.");
  }
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  if (items.length === 0) {
    throw new Error("Item transaksi tidak ditemukan.");
  }
  for (const item of items) {
    const productId = String(item.product_id ?? "");
    const quantity = Number(item.quantity ?? 0);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }
    await incrementProductStock({
      productId,
      quantity
    });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const extendedPayload = {
    stock_restored: true,
    stock_restored_at: now,
    notes: appendAdminNote(order.notes ?? null, `${RESTORE_MARKER} Stok dikembalikan admin.`),
    updated_at: now
  };
  const firstResult = await db.from("orders").update(extendedPayload).eq("id", orderId);
  if (!firstResult.error) {
    return;
  }
  if (!isMissingColumnError(firstResult.error.message)) {
    throw new Error(firstResult.error.message);
  }
  const { error } = await db.from("orders").update({
    notes: appendAdminNote(order.notes ?? null, `${RESTORE_MARKER} Stok dikembalikan admin.`),
    updated_at: now
  }).eq("id", orderId);
  if (error) {
    throw new Error(error.message);
  }
}
async function getBasicOrder(orderId) {
  const { data, error } = await db.from("orders").select("id, notes").eq("id", orderId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function getOrderForStockRestore(orderId) {
  const extendedResult = await db.from("orders").select(
    `
      id,
      notes,
      stock_restored,
      order_items(
        id,
        product_id,
        quantity
      )
    `
  ).eq("id", orderId).maybeSingle();
  if (!extendedResult.error) {
    return extendedResult.data;
  }
  if (!isMissingColumnError(extendedResult.error.message)) {
    throw new Error(extendedResult.error.message);
  }
  const baseResult = await db.from("orders").select(
    `
      id,
      notes,
      order_items(
        id,
        product_id,
        quantity
      )
    `
  ).eq("id", orderId).maybeSingle();
  if (baseResult.error) {
    throw new Error(baseResult.error.message);
  }
  return baseResult.data;
}
async function incrementProductStock({
  productId,
  quantity
}) {
  const rpcResult = await db.rpc("increment_product_stock", {
    p_product_id: productId,
    p_quantity: quantity
  });
  if (!rpcResult.error) {
    return;
  }
  const { data: product, error: productError } = await db.from("products").select("id, stock").eq("id", productId).maybeSingle();
  if (productError) {
    throw new Error(productError.message);
  }
  if (!product) {
    throw new Error("Produk tidak ditemukan saat restore stok.");
  }
  const currentStock = Number(product.stock ?? 0);
  const { error: updateError } = await db.from("products").update({
    stock: currentStock + quantity,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", productId);
  if (updateError) {
    throw new Error(updateError.message);
  }
}
function appendAdminNote(notes, message) {
  const current = String(notes ?? "").trim();
  const next = `[ADMIN] ${(/* @__PURE__ */ new Date()).toLocaleString("id-ID")} - ${message}`;
  return current ? `${current}
${next}` : next;
}
function getCancelReasonFromNotes(notes) {
  const value = String(notes ?? "");
  if (!value.toLowerCase().includes("pembatalan")) {
    return null;
  }
  return value;
}
function isMissingColumnError(message) {
  const value = message.toLowerCase();
  return value.includes("column") && (value.includes("does not exist") || value.includes("schema cache") || value.includes("could not find"));
}
function formatIDR(value) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return "Rp 0";
  }
  return "Rp " + new Intl.NumberFormat("id-ID").format(numberValue);
}
function orderStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi_penjual: "Menunggu Konfirmasi Penjual",
    diproses_penjual: "Diproses Penjual",
    dikirim: "Dikirim",
    pesanan_diterima: "Pesanan Diterima",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan"
  };
  if (!status) return "-";
  return labels[status] ?? status;
}
function paymentStatusLabel(status) {
  const labels = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    pembayaran_diproses: "Pembayaran Diproses",
    pembayaran_berhasil: "Dibayar",
    pembayaran_gagal: "Pembayaran Gagal",
    kedaluwarsa: "Kedaluwarsa",
    dibayar: "Dibayar",
    gagal: "Gagal",
    dikembalikan: "Dikembalikan"
  };
  if (!status) return "-";
  return labels[status] ?? status;
}
function paymentMethodLabel(method) {
  const labels = {
    transfer_bank: "Transfer Bank Manual",
    ewallet: "E-Wallet Manual",
    cod: "COD / Bayar di Tempat",
    qris: "QRIS"
  };
  if (!method) return "-";
  return labels[method] ?? method;
}
function shippingMethodLabel(method) {
  const labels = {
    regular: "Regular",
    instant: "Instant",
    same_day: "Same Day",
    pickup: "Ambil Sendiri",
    Reguler: "Reguler",
    Hemat: "Hemat",
    Express: "Express"
  };
  if (!method) return "-";
  return labels[method] ?? method;
}
const orderStatusOptions = [{
  value: "",
  label: "Semua Status Order"
}, {
  value: "menunggu_pembayaran",
  label: "Menunggu Pembayaran"
}, {
  value: "menunggu_konfirmasi_penjual",
  label: "Menunggu Konfirmasi Penjual"
}, {
  value: "diproses_penjual",
  label: "Diproses Penjual"
}, {
  value: "dikirim",
  label: "Dikirim"
}, {
  value: "pesanan_diterima",
  label: "Pesanan Diterima"
}, {
  value: "selesai",
  label: "Selesai"
}, {
  value: "dibatalkan",
  label: "Dibatalkan"
}];
const paymentStatusOptions = [{
  value: "",
  label: "Semua Status Pembayaran"
}, {
  value: "menunggu_pembayaran",
  label: "Menunggu Pembayaran"
}, {
  value: "dibayar",
  label: "Dibayar"
}, {
  value: "pembayaran_berhasil",
  label: "Pembayaran Berhasil"
}, {
  value: "pembayaran_diproses",
  label: "Pembayaran Diproses"
}, {
  value: "pembayaran_gagal",
  label: "Pembayaran Gagal"
}, {
  value: "dikembalikan",
  label: "Dikembalikan"
}, {
  value: "kedaluwarsa",
  label: "Kedaluwarsa"
}];
const orderActionOptions = orderStatusOptions.filter((item) => item.value);
const paymentActionOptions = paymentStatusOptions.filter((item) => item.value);
function AdminTransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  async function loadTransactions() {
    setLoading(true);
    try {
      const rows = await getAdminTransactions({
        search,
        orderStatus,
        paymentStatus,
        limit: 200
      });
      setTransactions(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat transaksi admin.");
      console.error("[Load Admin Transactions Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadTransactions();
  }, []);
  const stats = useMemo(() => {
    const waitingPayment = transactions.filter((item) => item.order_status === "menunggu_pembayaran").length;
    const processing = transactions.filter((item) => ["menunggu_konfirmasi_penjual", "diproses_penjual"].includes(item.order_status)).length;
    const shipped = transactions.filter((item) => item.order_status === "dikirim").length;
    const finished = transactions.filter((item) => ["pesanan_diterima", "selesai"].includes(item.order_status)).length;
    const cancelled = transactions.filter((item) => item.order_status === "dibatalkan").length;
    const activeGross = transactions.filter((item) => item.order_status !== "dibatalkan").reduce((sum, item) => sum + Number(item.total ?? 0), 0);
    return [{
      label: "Total Transaksi",
      value: transactions.length,
      icon: ShoppingBag
    }, {
      label: "Menunggu Bayar",
      value: waitingPayment,
      icon: Clock
    }, {
      label: "Diproses",
      value: processing,
      icon: Package
    }, {
      label: "Dikirim",
      value: shipped,
      icon: Truck
    }, {
      label: "Selesai",
      value: finished,
      icon: CheckCircle2
    }, {
      label: "Dibatalkan",
      value: cancelled,
      icon: XCircle
    }, {
      label: "Nilai Transaksi Aktif",
      value: formatIDR(activeGross),
      icon: ShoppingBag
    }];
  }, [transactions]);
  function handleApplyFilter() {
    loadTransactions();
  }
  function handleResetFilter() {
    setSearch("");
    setOrderStatus("");
    setPaymentStatus("");
    setTimeout(() => {
      loadTransactions();
    }, 0);
  }
  async function handleUpdateOrderStatus(transaction, nextStatus) {
    if (!nextStatus || nextStatus === transaction.order_status) return;
    const confirmed = window.confirm(`Ubah status order menjadi "${orderStatusLabel(nextStatus)}"?`);
    if (!confirmed) return;
    setUpdatingId(`${transaction.id}:order`);
    try {
      await updateAdminOrderStatus({
        orderId: transaction.id,
        orderStatus: nextStatus
      });
      toast.success("Status order berhasil diperbarui.");
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status order.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleUpdatePaymentStatus(transaction, nextStatus) {
    if (!nextStatus || nextStatus === transaction.payment_status) return;
    const confirmed = window.confirm(`Ubah status pembayaran menjadi "${paymentStatusLabel(nextStatus)}"?`);
    if (!confirmed) return;
    setUpdatingId(`${transaction.id}:payment`);
    try {
      await updateAdminPaymentStatus({
        orderId: transaction.id,
        paymentStatus: nextStatus
      });
      toast.success("Status pembayaran berhasil diperbarui.");
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status pembayaran.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleMarkPaid(transaction) {
    setUpdatingId(`${transaction.id}:paid`);
    try {
      await updateAdminPaymentStatus({
        orderId: transaction.id,
        paymentStatus: "dibayar"
      });
      toast.success("Transaksi berhasil ditandai dibayar.");
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menandai transaksi sebagai dibayar.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleCancel(transaction) {
    const reason = window.prompt("Masukkan alasan pembatalan transaksi:", "Dibatalkan oleh admin.");
    if (reason === null) return;
    setUpdatingId(`${transaction.id}:cancel`);
    try {
      await cancelAdminTransaction({
        orderId: transaction.id,
        reason
      });
      toast.success("Transaksi berhasil dibatalkan.");
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan transaksi.");
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleRestoreStock(transaction) {
    const confirmed = window.confirm("Kembalikan stok produk dari transaksi ini? Aksi ini tidak boleh dilakukan berulang.");
    if (!confirmed) return;
    setUpdatingId(`${transaction.id}:restore`);
    try {
      await restoreAdminTransactionStock(transaction.id);
      toast.success("Stok transaksi berhasil dikembalikan.");
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal restore stok transaksi.");
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Monitoring Transaksi" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau transaksi buyer dan seller, status pembayaran, status order, resi, pembatalan, dan restore stok." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Admin"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: loadTransactions, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-7", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsx(stat.icon, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 text-xl font-bold", children: stat.value }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: stat.label })
      ] }, stat.label)) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), onKeyDown: (event) => {
            if (event.key === "Enter") {
              handleApplyFilter();
            }
          }, placeholder: "Cari order, pembeli, penjual, produk, atau resi...", className: "pl-9" })
        ] }),
        /* @__PURE__ */ jsx("select", { value: orderStatus, onChange: (event) => setOrderStatus(event.target.value), className: "h-9 rounded-md border border-input bg-background px-3 text-sm", children: orderStatusOptions.map((status) => /* @__PURE__ */ jsx("option", { value: status.value, children: status.label }, status.value)) }),
        /* @__PURE__ */ jsx("select", { value: paymentStatus, onChange: (event) => setPaymentStatus(event.target.value), className: "h-9 rounded-md border border-input bg-background px-3 text-sm", children: paymentStatusOptions.map((status) => /* @__PURE__ */ jsx("option", { value: status.value, children: status.label }, status.value)) }),
        /* @__PURE__ */ jsx(Button, { onClick: handleApplyFilter, disabled: loading, children: "Terapkan" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleResetFilter, disabled: loading, children: "Reset" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : transactions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "Transaksi tidak ditemukan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Coba ubah filter atau refresh data transaksi." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: transactions.map((transaction) => /* @__PURE__ */ jsx(TransactionCard, { transaction, updatingId, onOrderStatusChange: handleUpdateOrderStatus, onPaymentStatusChange: handleUpdatePaymentStatus, onMarkPaid: handleMarkPaid, onCancel: handleCancel, onRestoreStock: handleRestoreStock }, transaction.id)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function TransactionCard({
  transaction,
  updatingId,
  onOrderStatusChange,
  onPaymentStatusChange,
  onMarkPaid,
  onCancel,
  onRestoreStock
}) {
  const isUpdating = updatingId?.startsWith(transaction.id) ?? false;
  const isCancelled = transaction.order_status === "dibatalkan";
  const isFinished = ["pesanan_diterima", "selesai"].includes(transaction.order_status);
  const isPaid = ["dibayar", "pembayaran_berhasil"].includes(transaction.payment_status);
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Order ID" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-xs font-semibold md:text-sm", children: transaction.id }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Info, { label: "Pembeli", value: transaction.buyer_name }),
          /* @__PURE__ */ jsx(Info, { label: "Penjual", value: transaction.seller_name })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(OrderStatusBadge, { status: transaction.order_status }),
        /* @__PURE__ */ jsx(PaymentStatusBadge, { status: transaction.payment_status })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-3 font-semibold", children: "Produk Dibeli" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: transaction.order_items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground", children: "Tidak ada item." }) : transaction.order_items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3 rounded-xl border border-border p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted", children: item.product_image ? /* @__PURE__ */ jsx("img", { src: item.product_image, alt: item.product_title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-muted-foreground", children: "No Image" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.product_id}`, className: "line-clamp-1 font-medium hover:text-primary", children: item.product_title }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
              item.quantity,
              " x ",
              formatIDR(item.price)
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold", children: formatIDR(item.line_total) })
          ] })
        ] }, item.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-accent p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Ringkasan Transaksi" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Info, { label: "Metode Pembayaran", value: paymentMethodLabel(transaction.payment_method) }),
            /* @__PURE__ */ jsx(Info, { label: "Metode Pengiriman", value: shippingMethodLabel(transaction.shipping_method) }),
            /* @__PURE__ */ jsx(Info, { label: "Ongkir", value: formatIDR(transaction.shipping_cost) }),
            /* @__PURE__ */ jsx(Info, { label: "Subtotal", value: formatIDR(transaction.subtotal) }),
            /* @__PURE__ */ jsx(Info, { label: "Total", value: formatIDR(transaction.total), strong: true })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Pengiriman & Stok" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Info, { label: "Kurir", value: transaction.courier || "-" }),
            /* @__PURE__ */ jsx(Info, { label: "Nomor Resi", value: transaction.tracking_number || "-" }),
            /* @__PURE__ */ jsx(Info, { label: "Dikirim Pada", value: transaction.shipped_at ? new Date(transaction.shipped_at).toLocaleString("id-ID") : "-" }),
            /* @__PURE__ */ jsx(Info, { label: "Stok Dikembalikan", value: transaction.stock_restored ? "Ya" : "Belum" })
          ] })
        ] }),
        isCancelled ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-red-200 bg-red-50 p-4 text-red-950", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Pembatalan" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Info, { label: "Alasan", value: transaction.cancel_reason || "-" }),
            /* @__PURE__ */ jsx(Info, { label: "Dibatalkan Pada", value: transaction.cancelled_at ? new Date(transaction.cancelled_at).toLocaleString("id-ID") : "-" })
          ] })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Info, { label: "Dibuat", value: new Date(transaction.created_at).toLocaleString("id-ID") }),
      /* @__PURE__ */ jsx(Info, { label: "Diperbarui", value: transaction.updated_at ? new Date(transaction.updated_at).toLocaleString("id-ID") : "-" }),
      /* @__PURE__ */ jsx(Info, { label: "Alamat", value: transaction.shipping_address || "-" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-border bg-background p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Kontrol Admin" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto]", children: [
        /* @__PURE__ */ jsx("select", { value: transaction.order_status, onChange: (event) => onOrderStatusChange(transaction, event.target.value), disabled: isUpdating, className: "h-9 rounded-md border border-input bg-background px-3 text-sm", children: orderActionOptions.map((status) => /* @__PURE__ */ jsx("option", { value: status.value, children: status.label }, status.value)) }),
        /* @__PURE__ */ jsx("select", { value: transaction.payment_status, onChange: (event) => onPaymentStatusChange(transaction, event.target.value), disabled: isUpdating, className: "h-9 rounded-md border border-input bg-background px-3 text-sm", children: paymentActionOptions.map((status) => /* @__PURE__ */ jsx("option", { value: status.value, children: status.label }, status.value)) }),
        !isPaid ? /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", onClick: () => onMarkPaid(transaction), disabled: isUpdating, children: [
          updatingId === `${transaction.id}:paid` ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
          "Tandai Dibayar"
        ] }) : null,
        !isCancelled && !isFinished ? /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "destructive", onClick: () => onCancel(transaction), disabled: isUpdating, children: [
          updatingId === `${transaction.id}:cancel` ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }),
          "Batalkan"
        ] }) : null,
        isCancelled && !transaction.stock_restored ? /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: () => onRestoreStock(transaction), disabled: isUpdating, children: [
          updatingId === `${transaction.id}:restore` ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
          "Restore Stok"
        ] }) : null
      ] })
    ] })
  ] });
}
function OrderStatusBadge({
  status
}) {
  const rawStatus = String(status ?? "");
  const className = {
    menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
    menunggu_konfirmasi_penjual: "bg-blue-100 text-blue-800",
    diproses_penjual: "bg-blue-100 text-blue-800",
    dikirim: "bg-purple-100 text-purple-800",
    pesanan_diterima: "bg-green-100 text-green-800",
    selesai: "bg-green-100 text-green-800",
    dibatalkan: "bg-red-100 text-red-800"
  }[rawStatus] ?? "bg-slate-100 text-slate-700";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${className}`, children: orderStatusLabel(rawStatus) });
}
function PaymentStatusBadge({
  status
}) {
  const rawStatus = String(status ?? "");
  const className = {
    menunggu_pembayaran: "bg-yellow-100 text-yellow-800",
    pembayaran_diproses: "bg-blue-100 text-blue-800",
    pembayaran_berhasil: "bg-green-100 text-green-800",
    dibayar: "bg-green-100 text-green-800",
    pembayaran_gagal: "bg-red-100 text-red-800",
    gagal: "bg-red-100 text-red-800",
    dikembalikan: "bg-slate-100 text-slate-700",
    kedaluwarsa: "bg-slate-100 text-slate-700"
  }[rawStatus] ?? "bg-slate-100 text-slate-700";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${className}`, children: paymentStatusLabel(rawStatus) });
}
function Info({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: strong ? "text-lg font-bold text-primary" : "font-medium", children: value || "-" })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "admin", children: /* @__PURE__ */ jsx(AdminTransactionPage, {}) });
export {
  SplitComponent as component
};
