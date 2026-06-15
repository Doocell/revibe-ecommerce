import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ShoppingBag, Loader2, RefreshCw, Package, MapPin, CreditCard, Truck, TicketPercent, AlertCircle, ShieldCheck, Trash2, Minus, Plus } from "lucide-react";
import { u as useAuth, N as Navbar, B as Button, F as Footer, s as supabase } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@radix-ui/react-label";
const db = supabase;
const PAYMENT_OPTIONS = [{
  value: "cod",
  label: "COD",
  description: "Bayar saat barang diterima."
}, {
  value: "transfer_bank",
  label: "Transfer Bank",
  description: "Transfer ke rekening yang tersedia."
}, {
  value: "qris",
  label: "QRIS",
  description: "Pembayaran menggunakan QRIS."
}];
const SHIPPING_OPTIONS = [{
  value: "Reguler",
  label: "Reguler",
  price: 1e4,
  estimate: "Estimasi 2–5 hari kerja"
}, {
  value: "JNE",
  label: "JNE",
  price: 12e3,
  estimate: "Estimasi 2–4 hari kerja"
}, {
  value: "J&T",
  label: "J&T",
  price: 12e3,
  estimate: "Estimasi 2–4 hari kerja"
}, {
  value: "SiCepat",
  label: "SiCepat",
  price: 15e3,
  estimate: "Estimasi 1–3 hari kerja"
}, {
  value: "Anteraja",
  label: "Anteraja",
  price: 14e3,
  estimate: "Estimasi 1–4 hari kerja"
}];
function CheckoutPage() {
  const {
    user,
    roles
  } = useAuth();
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("Reguler");
  const [manualAddress, setManualAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingItemKey, setUpdatingItemKey] = useState(null);
  const isBuyer = (roles ?? []).includes("buyer");
  const buyNowProductId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("buy_now") ?? params.get("product") ?? "";
  }, []);
  const buyNowQuantity = useMemo(() => {
    if (typeof window === "undefined") return 1;
    const params = new URLSearchParams(window.location.search);
    const qty = Number(params.get("qty") ?? 1);
    if (!Number.isFinite(qty) || qty <= 0) return 1;
    return Math.max(1, Math.floor(qty));
  }, []);
  const selectedShipping = useMemo(() => {
    return SHIPPING_OPTIONS.find((option) => option.value === shippingMethod) ?? SHIPPING_OPTIONS[0];
  }, [shippingMethod]);
  const groupedBySeller = useMemo(() => {
    const result = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      const current = result.get(item.sellerId) ?? [];
      current.push(item);
      result.set(item.sellerId, current);
    });
    return Array.from(result.entries()).map(([sellerId, sellerItems]) => ({
      sellerId,
      items: sellerItems
    }));
  }, [items]);
  const singleSellerId = useMemo(() => {
    return groupedBySeller.length === 1 ? groupedBySeller[0].sellerId : "";
  }, [groupedBySeller]);
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }, [items]);
  const shippingCost = useMemo(() => {
    const sellerCount = Math.max(groupedBySeller.length, 1);
    return selectedShipping.price * sellerCount;
  }, [selectedShipping.price, groupedBySeller.length]);
  const voucherDiscount = useMemo(() => {
    return Number(appliedVoucher?.discount_amount ?? 0);
  }, [appliedVoucher]);
  const totalBeforeDiscount = subtotal + shippingCost;
  const total = Math.max(totalBeforeDiscount - voucherDiscount, 0);
  const voucherAvailable = groupedBySeller.length === 1 && subtotal > 0;
  const selectedAddress = useMemo(() => {
    return addressOptions.find((address) => address.id === selectedAddressId) ?? null;
  }, [addressOptions, selectedAddressId]);
  const shippingAddress = useMemo(() => {
    const manual = manualAddress.trim();
    if (manual) return manual;
    if (selectedAddress?.fullAddress) {
      return selectedAddress.fullAddress;
    }
    const profileAddress = buildProfileAddress(profile);
    if (profileAddress) return profileAddress;
    return "";
  }, [manualAddress, selectedAddress, profile]);
  const hasStockProblem = useMemo(() => {
    return items.some((item) => !isItemAvailable(item));
  }, [items]);
  useEffect(() => {
    setAppliedVoucher(null);
  }, [subtotal, singleSellerId, groupedBySeller.length]);
  async function loadCheckout() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cartResult, profileResult] = await Promise.all([db.from("cart_items").select(`
            id,
            buyer_id,
            product_id,
            quantity,
            products(
              id,
              seller_id,
              title,
              description,
              price,
              stock,
              status,
              images,
              location
            )
          `).eq("buyer_id", user.id).order("created_at", {
        ascending: false
      }), db.from("profiles").select("id, full_name, whatsapp, address, city").eq("id", user.id).maybeSingle()]);
      if (cartResult.error) {
        throw new Error(cartResult.error.message);
      }
      if (profileResult.error) {
        throw new Error(profileResult.error.message);
      }
      const rawCartItems = cartResult.data ?? [];
      let nextItems = [];
      if (buyNowProductId) {
        const cartBuyNowItems = rawCartItems.filter((item) => item.product_id === buyNowProductId).map((item) => normalizeCheckoutItem(item, "buy_now")).filter((item) => Boolean(item));
        if (cartBuyNowItems.length > 0) {
          nextItems = cartBuyNowItems;
        } else {
          const directItem = await loadDirectBuyNowItem({
            productId: buyNowProductId,
            quantity: buyNowQuantity
          });
          nextItems = directItem ? [directItem] : [];
        }
      } else {
        nextItems = rawCartItems.map((item) => normalizeCheckoutItem(item, "cart")).filter((item) => Boolean(item));
      }
      const buyerProfile = profileResult.data ?? null;
      const loadedAddressOptions = await loadBuyerAddressOptions(user.id, buyerProfile);
      setItems(nextItems);
      setProfile(buyerProfile);
      setAddressOptions(loadedAddressOptions);
      setSelectedAddressId((current) => {
        if (current && loadedAddressOptions.some((address) => address.id === current)) {
          return current;
        }
        const defaultAddress = loadedAddressOptions.find((address) => address.isDefault) ?? loadedAddressOptions[0] ?? null;
        return defaultAddress?.id ?? "";
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat checkout.");
      console.error("[Checkout Load Error]", error);
    } finally {
      setLoading(false);
    }
  }
  async function loadDirectBuyNowItem({
    productId,
    quantity
  }) {
    const {
      data,
      error
    } = await db.from("products").select(`
        id,
        seller_id,
        title,
        description,
        price,
        stock,
        status,
        images,
        location
      `).eq("id", productId).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;
    const product = data;
    const images = Array.isArray(product.images) ? product.images : [];
    return {
      cartItemId: "",
      productId: String(product.id),
      sellerId: String(product.seller_id ?? ""),
      title: String(product.title ?? "Produk"),
      description: product.description ?? null,
      image: images[0] ?? "",
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      quantity: Math.max(1, quantity),
      status: String(product.status ?? ""),
      location: String(product.location ?? ""),
      source: "buy_now"
    };
  }
  useEffect(() => {
    loadCheckout();
  }, [user?.id, buyNowProductId]);
  async function updateCheckoutQuantity(item, nextQuantity) {
    if (nextQuantity < 1) return;
    if (nextQuantity > item.stock) {
      toast.error("Jumlah melebihi stok tersedia.");
      return;
    }
    const itemKey = getCheckoutItemKey(item);
    setUpdatingItemKey(itemKey);
    try {
      if (item.cartItemId) {
        const {
          error
        } = await db.from("cart_items").update({
          quantity: nextQuantity
        }).eq("id", item.cartItemId).eq("buyer_id", user?.id ?? "");
        if (error) {
          throw new Error(error.message);
        }
        window.dispatchEvent(new Event("cart-updated"));
      }
      setItems((current) => current.map((currentItem) => getCheckoutItemKey(currentItem) === itemKey ? {
        ...currentItem,
        quantity: nextQuantity
      } : currentItem));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah jumlah.");
    } finally {
      setUpdatingItemKey(null);
    }
  }
  async function removeCheckoutItem(item) {
    const confirmed = window.confirm("Hapus produk ini dari checkout?");
    if (!confirmed) return;
    const itemKey = getCheckoutItemKey(item);
    setUpdatingItemKey(itemKey);
    try {
      if (item.cartItemId) {
        const {
          error
        } = await db.from("cart_items").delete().eq("id", item.cartItemId).eq("buyer_id", user?.id ?? "");
        if (error) {
          throw new Error(error.message);
        }
        window.dispatchEvent(new Event("cart-updated"));
      }
      setItems((current) => current.filter((currentItem) => getCheckoutItemKey(currentItem) !== itemKey));
      toast.success("Produk dihapus dari checkout.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus produk.");
    } finally {
      setUpdatingItemKey(null);
    }
  }
  async function handleApplyVoucher() {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      toast.error("Masukkan kode voucher terlebih dahulu.");
      return;
    }
    if (!voucherAvailable || !singleSellerId) {
      toast.error("Voucher hanya bisa digunakan untuk checkout dari satu seller.");
      return;
    }
    setCheckingVoucher(true);
    try {
      const {
        data,
        error
      } = await db.rpc("revibe_validate_voucher", {
        p_seller_id: singleSellerId,
        p_code: code,
        p_subtotal: subtotal
      });
      if (error) {
        throw new Error(error.message);
      }
      const result = normalizeVoucherResult(data);
      if (!result.ok) {
        throw new Error(result.message || "Voucher tidak valid.");
      }
      if (result.discount_amount <= 0) {
        throw new Error("Voucher tidak menghasilkan diskon untuk order ini.");
      }
      setAppliedVoucher(result);
      setVoucherCode(result.code);
      toast.success(`Voucher ${result.code} berhasil dipakai.`);
    } catch (error) {
      setAppliedVoucher(null);
      toast.error(error instanceof Error ? error.message : "Voucher tidak valid.");
    } finally {
      setCheckingVoucher(false);
    }
  }
  function clearVoucher() {
    setAppliedVoucher(null);
    setVoucherCode("");
  }
  async function handleSubmitCheckout() {
    if (!user?.id) {
      toast.error("Silakan login sebagai pembeli terlebih dahulu.");
      window.location.href = "/login/pembeli";
      return;
    }
    if (!isBuyer) {
      toast.error("Checkout hanya tersedia untuk akun pembeli.");
      return;
    }
    if (items.length === 0) {
      toast.error("Tidak ada produk untuk checkout.");
      return;
    }
    if (!shippingAddress.trim()) {
      toast.error("Alamat pengiriman wajib dipilih atau diisi.");
      return;
    }
    const invalidSellerItem = items.find((item) => !item.sellerId);
    if (invalidSellerItem) {
      toast.error(`Seller produk "${invalidSellerItem.title}" tidak valid.`);
      return;
    }
    const unavailableItem = items.find((item) => !isItemAvailable(item));
    if (unavailableItem) {
      toast.error(`Produk "${unavailableItem.title}" tidak tersedia atau stok tidak cukup.`);
      await loadCheckout();
      return;
    }
    if (voucherCode.trim() && !appliedVoucher) {
      toast.error("Klik Terapkan Voucher terlebih dahulu sebelum checkout.");
      return;
    }
    setSubmitting(true);
    try {
      const createdOrderIds = [];
      const shippingPerSeller = selectedShipping.price;
      for (const group of groupedBySeller) {
        const rpcItems = group.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity
        }));
        const {
          data: orderId,
          error
        } = await db.rpc("revibe_create_order_atomic", {
          p_buyer_id: user.id,
          p_seller_id: group.sellerId,
          p_items: rpcItems,
          p_shipping_address: shippingAddress.trim(),
          p_payment_method: paymentMethod,
          p_shipping_method: shippingMethod,
          p_shipping_cost: shippingPerSeller,
          p_order_status: "menunggu_konfirmasi_penjual",
          p_payment_status: "dibayar"
        });
        if (error) {
          throw new Error(error.message);
        }
        if (orderId) {
          const safeOrderId = String(orderId);
          createdOrderIds.push(safeOrderId);
          if (appliedVoucher && voucherAvailable && singleSellerId && group.sellerId === singleSellerId) {
            const {
              error: voucherApplyError
            } = await db.rpc("revibe_apply_voucher_to_order", {
              p_order_id: safeOrderId,
              p_buyer_id: user.id,
              p_seller_id: group.sellerId,
              p_code: appliedVoucher.code
            });
            if (voucherApplyError) {
              console.error("[Apply Voucher To Order Error]", voucherApplyError);
              toast.warning("Order berhasil dibuat, tetapi voucher gagal diterapkan.");
            }
          }
        }
      }
      const cartItemIds = items.map((item) => item.cartItemId).filter((id) => Boolean(id));
      if (cartItemIds.length > 0) {
        const {
          error: deleteCartError
        } = await db.from("cart_items").delete().eq("buyer_id", user.id).in("id", cartItemIds);
        if (deleteCartError) {
          console.error("[Checkout Delete Cart Error]", deleteCartError);
        }
      }
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Checkout berhasil. Pesanan sudah dibuat.");
      const firstOrderId = createdOrderIds[0];
      window.location.href = firstOrderId ? `/dashboard/pembeli?order=${firstOrderId}` : "/dashboard/pembeli";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout gagal diproses.";
      toast.error(message);
      await loadCheckout();
    } finally {
      setSubmitting(false);
    }
  }
  if (!user?.id) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Checkout" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login sebagai pembeli untuk melanjutkan checkout." }),
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
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Checkout" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Konfirmasi produk, alamat, metode pembayaran, pengiriman, dan voucher sebelum pesanan dibuat." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadCheckout, disabled: loading || submitting, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/keranjang", children: "Keranjang" }) })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : items.length === 0 ? /* @__PURE__ */ jsx(EmptyCheckout, {}) : /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[1fr_390px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs(CheckoutSection, { title: "Produk Checkout", description: buyNowProductId ? "Produk beli langsung yang akan diproses." : "Produk dari keranjang yang akan diproses.", icon: /* @__PURE__ */ jsx(Package, { className: "h-5 w-5 text-primary" }), children: [
            /* @__PURE__ */ jsx("div", { className: "space-y-4", children: items.map((item) => {
              const itemKey = getCheckoutItemKey(item);
              return /* @__PURE__ */ jsx(CheckoutProductCard, { item, updating: updatingItemKey === itemKey, onIncrease: () => updateCheckoutQuantity(item, item.quantity + 1), onDecrease: () => updateCheckoutQuantity(item, item.quantity - 1), onQuantityChange: (value) => updateCheckoutQuantity(item, value), onRemove: () => removeCheckoutItem(item) }, itemKey);
            }) }),
            hasStockProblem ? /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive", children: "Ada produk yang stoknya tidak cukup atau belum aktif. Silakan refresh checkout atau ubah keranjang." }) : null
          ] }),
          /* @__PURE__ */ jsx(CheckoutSection, { title: "Alamat Pengiriman", description: "Pilih alamat tersimpan atau isi alamat khusus checkout.", icon: /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-primary" }), children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            addressOptions.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: addressOptions.map((address) => /* @__PURE__ */ jsx(AddressOptionCard, { address, selected: selectedAddressId === address.id && !manualAddress.trim(), onSelect: () => {
              setSelectedAddressId(address.id);
              setManualAddress("");
            } }, address.id)) }) : /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800", children: "Belum ada alamat tersimpan. Isi alamat khusus checkout di bawah ini agar pembayaran bisa diproses." }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Alamat Khusus Checkout" }),
              /* @__PURE__ */ jsx(Textarea, { value: manualAddress, onChange: (event) => setManualAddress(event.target.value), placeholder: "Isi alamat lengkap jika ingin memakai alamat lain. Contoh: Jalan..., Kecamatan..., Kota..., Provinsi..., Kode Pos...", rows: 4 }),
              manualAddress.trim() ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary", children: "Alamat khusus checkout sedang digunakan." }) : null
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-green-100 p-4 text-green-950", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "mt-0.5 h-5 w-5 text-green-700" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Alamat yang digunakan" }),
                /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-green-900", children: shippingAddress || "Alamat belum dipilih/diisi." })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx(Button, { asChild: true, type: "button", variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/profil", children: "Kelola Profil" }) }),
              /* @__PURE__ */ jsx(Button, { asChild: true, type: "button", variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/pembeli", children: "Dashboard Pembeli" }) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(CheckoutSection, { title: "Metode Pembayaran", description: "Pilih metode pembayaran yang akan digunakan.", icon: /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5 text-primary" }), children: /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-3", children: PAYMENT_OPTIONS.map((option) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setPaymentMethod(option.value), className: `rounded-2xl border p-4 text-left transition ${paymentMethod === option.value ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-background hover:border-primary/40"}`, children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: option.label }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-6 text-muted-foreground", children: option.description })
          ] }, option.value)) }) }),
          /* @__PURE__ */ jsx(CheckoutSection, { title: "Metode Pengiriman", description: "Pilih jasa pengiriman dan estimasi ongkir.", icon: /* @__PURE__ */ jsx(Truck, { className: "h-5 w-5 text-primary" }), children: /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: SHIPPING_OPTIONS.map((option) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setShippingMethod(option.value), className: `rounded-2xl border p-4 text-left transition ${shippingMethod === option.value ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-background hover:border-primary/40"}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: option.label }),
              /* @__PURE__ */ jsx("div", { className: "font-bold text-primary", children: formatIDR(option.price) })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: option.estimate })
          ] }, option.value)) }) }),
          /* @__PURE__ */ jsx(CheckoutSection, { title: "Voucher / Kupon Diskon", description: "Masukkan kode voucher dari seller untuk mendapatkan diskon.", icon: /* @__PURE__ */ jsx(TicketPercent, { className: "h-5 w-5 text-primary" }), children: !voucherAvailable ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800", children: "Voucher hanya bisa dipakai jika checkout berisi produk dari satu seller. Untuk banyak seller, checkout produk per seller agar kode voucher bisa digunakan." }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_auto_auto]", children: [
              /* @__PURE__ */ jsx(Input, { value: voucherCode, onChange: (event) => setVoucherCode(event.target.value.toUpperCase()), placeholder: "Masukkan kode voucher, contoh: REVIBE10", disabled: checkingVoucher || submitting }),
              /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: checkingVoucher || submitting, onClick: handleApplyVoucher, children: [
                checkingVoucher ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(TicketPercent, { className: "mr-2 h-4 w-4" }),
                "Terapkan"
              ] }),
              appliedVoucher ? /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", disabled: checkingVoucher || submitting, onClick: clearVoucher, children: "Hapus" }) : null
            ] }),
            appliedVoucher ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800", children: [
              "Voucher ",
              /* @__PURE__ */ jsx("b", { children: appliedVoucher.code }),
              " berhasil diterapkan. Diskon:",
              " ",
              /* @__PURE__ */ jsx("b", { children: formatIDR(appliedVoucher.discount_amount) })
            ] }) : /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Kode voucher divalidasi berdasarkan seller dan subtotal produk sebelum ongkir." })
          ] }) }),
          /* @__PURE__ */ jsx(CheckoutSection, { title: "Catatan Pesanan", description: "Opsional. Tambahkan instruksi untuk penjual.", icon: /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-primary" }), children: /* @__PURE__ */ jsx(Textarea, { value: notes, onChange: (event) => setNotes(event.target.value), placeholder: "Contoh: tolong packing rapi, hubungi via WhatsApp sebelum dikirim.", rows: 3 }) })
        ] }),
        /* @__PURE__ */ jsxs("aside", { className: "h-fit rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ShoppingBag, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Ringkasan" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3 text-sm", children: [
            /* @__PURE__ */ jsx(SummaryRow, { label: "Jumlah Produk", value: `${items.length} item` }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Subtotal Produk", value: formatIDR(subtotal) }),
            /* @__PURE__ */ jsx(SummaryRow, { label: `Ongkir (${Math.max(groupedBySeller.length, 1)} seller)`, value: formatIDR(shippingCost) }),
            appliedVoucher ? /* @__PURE__ */ jsx(SummaryRow, { label: `Diskon Voucher (${appliedVoucher.code})`, value: `- ${formatIDR(voucherDiscount)}` }) : null,
            /* @__PURE__ */ jsx(SummaryRow, { label: "Metode Bayar", value: paymentMethodLabel(paymentMethod) }),
            /* @__PURE__ */ jsx(SummaryRow, { label: "Pengiriman", value: shippingMethod }),
            /* @__PURE__ */ jsx("div", { className: "border-t border-border pt-3", children: /* @__PURE__ */ jsx(SummaryRow, { label: "Total", value: formatIDR(total), strong: true }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl bg-accent p-4 text-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Alamat dikirim ke:" }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-muted-foreground", children: shippingAddress || "Alamat belum dipilih/diisi." })
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "button", disabled: submitting || loading || items.length === 0 || hasStockProblem || !shippingAddress.trim(), onClick: handleSubmitCheckout, className: "mt-6 w-full gradient-brand text-white", children: [
            submitting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CreditCard, { className: "mr-2 h-4 w-4" }),
            "Bayar Sekarang"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, type: "button", variant: "outline", className: "mt-3 w-full", children: /* @__PURE__ */ jsx("a", { href: "/keranjang", children: "Kembali ke Keranjang" }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs leading-6 text-primary", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "mt-0.5 h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsx("div", { children: "Stok dikunci langsung di database saat checkout. Voucher divalidasi sebelum order dibuat dan disimpan ke order jika berhasil." })
          ] }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function CheckoutSection({
  title,
  description,
  icon,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-primary/10 p-3", children: icon }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children })
  ] });
}
function CheckoutProductCard({
  item,
  updating,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onRemove
}) {
  const isStockProblem = !isItemAvailable(item);
  function handleQuantityInput(event) {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue)) return;
    onQuantityChange(Math.max(1, Math.floor(nextValue)));
  }
  return /* @__PURE__ */ jsx("div", { className: `rounded-2xl border p-4 ${isStockProblem ? "border-destructive/40 bg-destructive/5" : "border-border bg-background"}`, children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-[96px_1fr]", children: [
    /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.productId}`, className: "h-24 w-24 overflow-hidden rounded-xl bg-muted", children: item.image ? /* @__PURE__ */ jsx("img", { src: item.image, alt: item.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-xs text-muted-foreground", children: "No Image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("a", { href: `/detail-produk?id=${item.productId}`, className: "line-clamp-2 font-semibold hover:text-primary", children: item.title }),
          item.description ? /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: item.description }) : null
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "ghost", size: "sm", disabled: updating, onClick: onRemove, className: "text-destructive hover:text-destructive", children: [
          updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
          "Hapus"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold text-primary", children: formatIDR(item.price) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
            "Stok tersedia: ",
            item.stock,
            " · Status:",
            " ",
            productStatusLabel(item.status)
          ] }),
          item.location ? /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
            "Lokasi: ",
            item.location
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: updating || item.quantity <= 1, onClick: onDecrease, children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: item.stock, value: item.quantity, onChange: handleQuantityInput, disabled: updating, className: "w-20 text-center" }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: updating || item.quantity >= item.stock, onClick: onIncrease, children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          item.quantity,
          " x ",
          formatIDR(item.price)
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: formatIDR(item.price * item.quantity) })
      ] }),
      isStockProblem ? /* @__PURE__ */ jsx("div", { className: "mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive", children: "Produk belum aktif, stok habis, atau jumlah melebihi stok." }) : null
    ] })
  ] }) });
}
function AddressOptionCard({
  address,
  selected,
  onSelect
}) {
  return /* @__PURE__ */ jsx("button", { type: "button", onClick: onSelect, className: `rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-background hover:border-primary/40"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: address.label || address.recipientName || "Alamat" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
        address.recipientName || "Penerima",
        " ",
        address.phone ? `· ${address.phone}` : ""
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm leading-6", children: address.fullAddress }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
        "Sumber: ",
        address.source
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-2", children: [
      address.isDefault ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700", children: "Utama" }) : null,
      selected ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary", children: "Dipilih" }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground", children: "Pilih" })
    ] })
  ] }) });
}
function EmptyCheckout() {
  return /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-dashed border-border p-10 text-center", children: [
    /* @__PURE__ */ jsx(Package, { className: "mx-auto h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Checkout kosong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tidak ada produk yang bisa diproses di checkout." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/produk", children: "Mulai Belanja" }) }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/keranjang", children: "Buka Keranjang" }) })
    ] })
  ] });
}
function SummaryRow({
  label,
  value,
  strong
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsx("span", { className: strong ? "font-semibold" : "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: strong ? "text-lg font-bold text-primary" : "font-medium", children: value })
  ] });
}
async function loadBuyerAddressOptions(buyerId, profile) {
  const options = [];
  const profileAddress = buildProfileAddressOption(profile);
  if (profileAddress) {
    options.push(profileAddress);
  }
  const addressTables = ["buyer_addresses", "shipping_addresses", "user_addresses", "addresses"];
  for (const tableName of addressTables) {
    const byBuyerId = await readAddressRows(tableName, "buyer_id", buyerId);
    const byUserId = await readAddressRows(tableName, "user_id", buyerId);
    const byProfileId = await readAddressRows(tableName, "profile_id", buyerId);
    [...byBuyerId, ...byUserId, ...byProfileId].forEach((row) => {
      const option = normalizeAddressRow(row, tableName);
      if (option?.fullAddress) {
        options.push(option);
      }
    });
  }
  return dedupeAddressOptions(options).sort((a, b) => {
    if (a.isDefault === b.isDefault) return 0;
    return a.isDefault ? -1 : 1;
  });
}
async function readAddressRows(tableName, columnName, userId) {
  try {
    const {
      data,
      error
    } = await db.from(tableName).select("*").eq(columnName, userId);
    if (error) {
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}
function buildProfileAddressOption(profile) {
  if (!profile) return null;
  const fullAddress = buildProfileAddress(profile);
  if (!fullAddress) return null;
  return {
    id: "profile-address",
    label: "Alamat Profil",
    recipientName: String(profile.full_name ?? "Pembeli"),
    phone: String(profile.whatsapp ?? ""),
    fullAddress,
    isDefault: true,
    source: "Profil"
  };
}
function buildProfileAddress(profile) {
  if (!profile) return "";
  const address = String(profile.address ?? "").trim();
  const city = String(profile.city ?? "").trim();
  return [address, city].filter(Boolean).join(", ");
}
function normalizeAddressRow(row, source) {
  const id = String(row.id ?? `${source}-${Math.random()}`);
  const label = String(row.label ?? row.name ?? row.title ?? row.address_label ?? row.type ?? "Alamat Tersimpan");
  const recipientName = String(row.recipient_name ?? row.receiver_name ?? row.full_name ?? row.name ?? row.contact_name ?? row.nama_penerima ?? "Pembeli");
  const phone = String(row.phone ?? row.phone_number ?? row.whatsapp ?? row.recipient_phone ?? row.receiver_phone ?? row.no_hp ?? "");
  const directFullAddress = String(row.full_address ?? row.complete_address ?? row.alamat_lengkap ?? "").trim();
  const address = String(row.address ?? row.detail_address ?? row.street_address ?? row.address_line ?? row.address_line1 ?? row.alamat ?? "").trim();
  const district = String(row.district ?? row.subdistrict ?? row.kecamatan ?? "").trim();
  const city = String(row.city ?? row.kota ?? row.regency ?? "").trim();
  const province = String(row.province ?? row.provinsi ?? "").trim();
  const postalCode = String(row.postal_code ?? row.zip_code ?? row.kode_pos ?? "").trim();
  const fullAddress = directFullAddress || [address, district, city, province, postalCode].filter(Boolean).join(", ");
  if (!fullAddress) return null;
  return {
    id,
    label,
    recipientName,
    phone,
    fullAddress,
    isDefault: Boolean(row.is_default ?? row.is_primary ?? false),
    source
  };
}
function dedupeAddressOptions(options) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  options.forEach((option) => {
    const key = `${option.fullAddress}|${option.phone}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(option);
  });
  return result;
}
function normalizeCheckoutItem(row, source) {
  const product = normalizeProduct(row.products);
  if (!product?.id) return null;
  const images = Array.isArray(product.images) ? product.images : [];
  return {
    cartItemId: String(row.id),
    productId: String(product.id),
    sellerId: String(product.seller_id ?? ""),
    title: String(product.title ?? "Produk"),
    description: product.description ?? null,
    image: images[0] ?? "",
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    quantity: Number(row.quantity ?? 0),
    status: String(product.status ?? ""),
    location: String(product.location ?? ""),
    source
  };
}
function normalizeProduct(value) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}
function normalizeVoucherResult(value) {
  return {
    ok: Boolean(value?.ok),
    voucher_id: String(value?.voucher_id ?? ""),
    code: String(value?.code ?? ""),
    name: String(value?.name ?? ""),
    discount_type: value?.discount_type === "percent" || value?.discount_type === "fixed" ? value.discount_type : "fixed",
    discount_value: Number(value?.discount_value ?? 0),
    discount_amount: Number(value?.discount_amount ?? 0),
    message: String(value?.message ?? "")
  };
}
function getCheckoutItemKey(item) {
  return `${item.cartItemId || "direct"}-${item.productId}`;
}
function isItemAvailable(item) {
  return ["approved", "active"].includes(String(item.status ?? "")) && item.stock > 0 && item.quantity > 0 && item.quantity <= item.stock;
}
function productStatusLabel(status) {
  const labels = {
    approved: "Aktif",
    active: "Aktif",
    pending: "Menunggu Verifikasi",
    rejected: "Ditolak",
    inactive: "Nonaktif"
  };
  return labels[String(status ?? "")] ?? status ?? "-";
}
function paymentMethodLabel(method) {
  const labels = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    bank_transfer: "Transfer Bank",
    qris: "QRIS"
  };
  return labels[String(method ?? "")] ?? method ?? "-";
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "buyer", children: /* @__PURE__ */ jsx(CheckoutPage, {}) });
export {
  SplitComponent as component
};
