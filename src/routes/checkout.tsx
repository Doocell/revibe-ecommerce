import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Trash2,
  Truck,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const Route = createFileRoute("/checkout")({
  component: () => (
    <RoleGuard required="buyer">
      <CheckoutPage />
    </RoleGuard>
  ),
});

type ProductRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number | string;
  original_price?: number | string | null;
  stock: number | string;
  status: string | null;
  images: string[] | null;
  location?: string | null;
};

type CartItemRow = {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  products: ProductRow | ProductRow[] | null;
};

type CheckoutItem = {
  cartItemId: string;
  productId: string;
  sellerId: string;
  title: string;
  description: string | null;
  image: string;
  price: number;
  stock: number;
  quantity: number;
  status: string;
  location: string;
  source: "cart" | "buy_now";
};

type BuyerProfile = {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
};

type AddressOption = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
  source: string;
};

type ShippingOption = {
  value: string;
  label: string;
  price: number;
  estimate: string;
};

type PaymentOption = {
  value: string;
  label: string;
  description: string;
};

type AppliedVoucher = {
  ok: boolean;
  voucher_id: string;
  code: string;
  name: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  discount_amount: number;
  message: string;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "cod",
    label: "COD",
    description: "Bayar saat barang diterima.",
  },
  {
    value: "transfer_bank",
    label: "Transfer Bank",
    description: "Transfer ke rekening yang tersedia.",
  },
  {
    value: "qris",
    label: "QRIS",
    description: "Pembayaran menggunakan QRIS.",
  },
];

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    value: "Reguler",
    label: "Reguler",
    price: 10000,
    estimate: "Estimasi 2–5 hari kerja",
  },
  {
    value: "JNE",
    label: "JNE",
    price: 12000,
    estimate: "Estimasi 2–4 hari kerja",
  },
  {
    value: "J&T",
    label: "J&T",
    price: 12000,
    estimate: "Estimasi 2–4 hari kerja",
  },
  {
    value: "SiCepat",
    label: "SiCepat",
    price: 15000,
    estimate: "Estimasi 1–3 hari kerja",
  },
  {
    value: "Anteraja",
    label: "Anteraja",
    price: 14000,
    estimate: "Estimasi 1–4 hari kerja",
  },
];

function CheckoutPage() {
  const { user, roles } = useAuth();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("Reguler");
  const [manualAddress, setManualAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null,
  );
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingItemKey, setUpdatingItemKey] = useState<string | null>(null);

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
    return (
      SHIPPING_OPTIONS.find((option) => option.value === shippingMethod) ??
      SHIPPING_OPTIONS[0]
    );
  }, [shippingMethod]);

  const groupedBySeller = useMemo(() => {
    const result = new Map<string, CheckoutItem[]>();

    items.forEach((item) => {
      const current = result.get(item.sellerId) ?? [];
      current.push(item);
      result.set(item.sellerId, current);
    });

    return Array.from(result.entries()).map(([sellerId, sellerItems]) => ({
      sellerId,
      items: sellerItems,
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
    return (
      addressOptions.find((address) => address.id === selectedAddressId) ?? null
    );
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
      const [cartResult, profileResult] = await Promise.all([
        db
          .from("cart_items")
          .select(
            `
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
          `,
          )
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false }),
        db
          .from("profiles")
          .select("id, full_name, whatsapp, address, city")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (cartResult.error) {
        throw new Error(cartResult.error.message);
      }

      if (profileResult.error) {
        throw new Error(profileResult.error.message);
      }

      const rawCartItems = (cartResult.data ?? []) as CartItemRow[];

      let nextItems: CheckoutItem[] = [];

      if (buyNowProductId) {
        const cartBuyNowItems = rawCartItems
          .filter((item) => item.product_id === buyNowProductId)
          .map((item) => normalizeCheckoutItem(item, "buy_now"))
          .filter((item): item is CheckoutItem => Boolean(item));

        if (cartBuyNowItems.length > 0) {
          nextItems = cartBuyNowItems;
        } else {
          const directItem = await loadDirectBuyNowItem({
            productId: buyNowProductId,
            quantity: buyNowQuantity,
          });

          nextItems = directItem ? [directItem] : [];
        }
      } else {
        nextItems = rawCartItems
          .map((item) => normalizeCheckoutItem(item, "cart"))
          .filter((item): item is CheckoutItem => Boolean(item));
      }

      const buyerProfile = (profileResult.data ?? null) as BuyerProfile | null;
      const loadedAddressOptions = await loadBuyerAddressOptions(
        user.id,
        buyerProfile,
      );

      setItems(nextItems);
      setProfile(buyerProfile);
      setAddressOptions(loadedAddressOptions);

      setSelectedAddressId((current) => {
        if (
          current &&
          loadedAddressOptions.some((address) => address.id === current)
        ) {
          return current;
        }

        const defaultAddress =
          loadedAddressOptions.find((address) => address.isDefault) ??
          loadedAddressOptions[0] ??
          null;

        return defaultAddress?.id ?? "";
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat checkout.",
      );
      console.error("[Checkout Load Error]", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDirectBuyNowItem({
    productId,
    quantity,
  }: {
    productId: string;
    quantity: number;
  }) {
    const { data, error } = await db
      .from("products")
      .select(
        `
        id,
        seller_id,
        title,
        description,
        price,
        stock,
        status,
        images,
        location
      `,
      )
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return null;

    const product = data as ProductRow;
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
      source: "buy_now" as const,
    };
  }

  useEffect(() => {
    loadCheckout();
  }, [user?.id, buyNowProductId]);

  async function updateCheckoutQuantity(
    item: CheckoutItem,
    nextQuantity: number,
  ) {
    if (nextQuantity < 1) return;

    if (nextQuantity > item.stock) {
      toast.error("Jumlah melebihi stok tersedia.");
      return;
    }

    const itemKey = getCheckoutItemKey(item);
    setUpdatingItemKey(itemKey);

    try {
      if (item.cartItemId) {
        const { error } = await db
          .from("cart_items")
          .update({
            quantity: nextQuantity,
          })
          .eq("id", item.cartItemId)
          .eq("buyer_id", user?.id ?? "");

        if (error) {
          throw new Error(error.message);
        }

        window.dispatchEvent(new Event("cart-updated"));
      }

      setItems((current) =>
        current.map((currentItem) =>
          getCheckoutItemKey(currentItem) === itemKey
            ? {
              ...currentItem,
              quantity: nextQuantity,
            }
            : currentItem,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah jumlah.",
      );
    } finally {
      setUpdatingItemKey(null);
    }
  }

  async function removeCheckoutItem(item: CheckoutItem) {
    const confirmed = window.confirm("Hapus produk ini dari checkout?");

    if (!confirmed) return;

    const itemKey = getCheckoutItemKey(item);
    setUpdatingItemKey(itemKey);

    try {
      if (item.cartItemId) {
        const { error } = await db
          .from("cart_items")
          .delete()
          .eq("id", item.cartItemId)
          .eq("buyer_id", user?.id ?? "");

        if (error) {
          throw new Error(error.message);
        }

        window.dispatchEvent(new Event("cart-updated"));
      }

      setItems((current) =>
        current.filter(
          (currentItem) => getCheckoutItemKey(currentItem) !== itemKey,
        ),
      );

      toast.success("Produk dihapus dari checkout.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus produk.",
      );
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
      toast.error(
        "Voucher hanya bisa digunakan untuk checkout dari satu seller.",
      );
      return;
    }

    setCheckingVoucher(true);

    try {
      const { data, error } = await db.rpc("revibe_validate_voucher", {
        p_seller_id: singleSellerId,
        p_code: code,
        p_subtotal: subtotal,
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
      toast.error(
        error instanceof Error ? error.message : "Voucher tidak valid.",
      );
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
      toast.error(
        `Produk "${unavailableItem.title}" tidak tersedia atau stok tidak cukup.`,
      );

      await loadCheckout();
      return;
    }

    if (voucherCode.trim() && !appliedVoucher) {
      toast.error("Klik Terapkan Voucher terlebih dahulu sebelum checkout.");
      return;
    }

    setSubmitting(true);

    try {
      const createdOrderIds: string[] = [];
      const shippingPerSeller = selectedShipping.price;

      for (const group of groupedBySeller) {
        const rpcItems = group.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        }));

        const { data: orderId, error } = await db.rpc(
          "revibe_create_order_atomic",
          {
            p_buyer_id: user.id,
            p_seller_id: group.sellerId,
            p_items: rpcItems,
            p_shipping_address: shippingAddress.trim(),
            p_payment_method: paymentMethod,
            p_shipping_method: shippingMethod,
            p_shipping_cost: shippingPerSeller,
            p_order_status: "menunggu_konfirmasi_penjual",
            p_payment_status: "dibayar",
          },
        );

        if (error) {
          throw new Error(error.message);
        }

        if (orderId) {
          const safeOrderId = String(orderId);
          createdOrderIds.push(safeOrderId);

          if (
            appliedVoucher &&
            voucherAvailable &&
            singleSellerId &&
            group.sellerId === singleSellerId
          ) {
            const { error: voucherApplyError } = await db.rpc(
              "revibe_apply_voucher_to_order",
              {
                p_order_id: safeOrderId,
                p_buyer_id: user.id,
                p_seller_id: group.sellerId,
                p_code: appliedVoucher.code,
              },
            );

            if (voucherApplyError) {
              console.error("[Apply Voucher To Order Error]", voucherApplyError);
              toast.warning(
                "Order berhasil dibuat, tetapi voucher gagal diterapkan.",
              );
            }
          }
        }
      }

      const cartItemIds = items
        .map((item) => item.cartItemId)
        .filter((id) => Boolean(id));

      if (cartItemIds.length > 0) {
        const { error: deleteCartError } = await db
          .from("cart_items")
          .delete()
          .eq("buyer_id", user.id)
          .in("id", cartItemIds);

        if (deleteCartError) {
          console.error("[Checkout Delete Cart Error]", deleteCartError);
        }
      }

      window.dispatchEvent(new Event("cart-updated"));

      toast.success("Checkout berhasil. Pesanan sudah dibuat.");

      const firstOrderId = createdOrderIds[0];

      window.location.href = firstOrderId
        ? `/dashboard/pembeli?order=${firstOrderId}`
        : "/dashboard/pembeli";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout gagal diproses.";

      toast.error(message);

      await loadCheckout();
    } finally {
      setSubmitting(false);
    }
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">Checkout</h1>

              <p className="mt-2 text-muted-foreground">
                Silakan login sebagai pembeli untuk melanjutkan checkout.
              </p>

              <Button asChild className="mt-6 gradient-brand text-white">
                <a href="/login/pembeli">Login Pembeli</a>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>

              <p className="mt-1 text-muted-foreground">
                Konfirmasi produk, alamat, metode pembayaran, pengiriman, dan
                voucher sebelum pesanan dibuat.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadCheckout}
                disabled={loading || submitting}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>

              <Button asChild variant="outline">
                <a href="/keranjang">Keranjang</a>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <EmptyCheckout />
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_390px]">
              <div className="space-y-6">
                <CheckoutSection
                  title="Produk Checkout"
                  description={
                    buyNowProductId
                      ? "Produk beli langsung yang akan diproses."
                      : "Produk dari keranjang yang akan diproses."
                  }
                  icon={<Package className="h-5 w-5 text-primary" />}
                >
                  <div className="space-y-4">
                    {items.map((item) => {
                      const itemKey = getCheckoutItemKey(item);

                      return (
                        <CheckoutProductCard
                          key={itemKey}
                          item={item}
                          updating={updatingItemKey === itemKey}
                          onIncrease={() =>
                            updateCheckoutQuantity(item, item.quantity + 1)
                          }
                          onDecrease={() =>
                            updateCheckoutQuantity(item, item.quantity - 1)
                          }
                          onQuantityChange={(value) =>
                            updateCheckoutQuantity(item, value)
                          }
                          onRemove={() => removeCheckoutItem(item)}
                        />
                      );
                    })}
                  </div>

                  {hasStockProblem ? (
                    <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      Ada produk yang stoknya tidak cukup atau belum aktif.
                      Silakan refresh checkout atau ubah keranjang.
                    </div>
                  ) : null}
                </CheckoutSection>

                <CheckoutSection
                  title="Alamat Pengiriman"
                  description="Pilih alamat tersimpan atau isi alamat khusus checkout."
                  icon={<MapPin className="h-5 w-5 text-primary" />}
                >
                  <div className="space-y-4">
                    {addressOptions.length > 0 ? (
                      <div className="grid gap-3">
                        {addressOptions.map((address) => (
                          <AddressOptionCard
                            key={address.id}
                            address={address}
                            selected={
                              selectedAddressId === address.id &&
                              !manualAddress.trim()
                            }
                            onSelect={() => {
                              setSelectedAddressId(address.id);
                              setManualAddress("");
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                        Belum ada alamat tersimpan. Isi alamat khusus checkout
                        di bawah ini agar pembayaran bisa diproses.
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label>Alamat Khusus Checkout</Label>

                      <Textarea
                        value={manualAddress}
                        onChange={(event) => setManualAddress(event.target.value)}
                        placeholder="Isi alamat lengkap jika ingin memakai alamat lain. Contoh: Jalan..., Kecamatan..., Kota..., Provinsi..., Kode Pos..."
                        rows={4}
                      />

                      {manualAddress.trim() ? (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                          Alamat khusus checkout sedang digunakan.
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl bg-green-100 p-4 text-green-950">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-green-700" />

                        <div>
                          <div className="font-semibold">
                            Alamat yang digunakan
                          </div>

                          <div className="mt-2 text-sm text-green-900">
                            {shippingAddress || "Alamat belum dipilih/diisi."}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild type="button" variant="outline">
                        <a href="/profil">Kelola Profil</a>
                      </Button>

                      <Button asChild type="button" variant="outline">
                        <a href="/dashboard/pembeli">Dashboard Pembeli</a>
                      </Button>
                    </div>
                  </div>
                </CheckoutSection>

                <CheckoutSection
                  title="Metode Pembayaran"
                  description="Pilih metode pembayaran yang akan digunakan."
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    {PAYMENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        className={`rounded-2xl border p-4 text-left transition ${paymentMethod === option.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                          }`}
                      >
                        <div className="font-semibold">{option.label}</div>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </CheckoutSection>

                <CheckoutSection
                  title="Metode Pengiriman"
                  description="Pilih jasa pengiriman dan estimasi ongkir."
                  icon={<Truck className="h-5 w-5 text-primary" />}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {SHIPPING_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setShippingMethod(option.value)}
                        className={`rounded-2xl border p-4 text-left transition ${shippingMethod === option.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{option.label}</div>

                          <div className="font-bold text-primary">
                            {formatIDR(option.price)}
                          </div>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {option.estimate}
                        </p>
                      </button>
                    ))}
                  </div>
                </CheckoutSection>

                <CheckoutSection
                  title="Voucher / Kupon Diskon"
                  description="Masukkan kode voucher dari seller untuk mendapatkan diskon."
                  icon={<TicketPercent className="h-5 w-5 text-primary" />}
                >
                  {!voucherAvailable ? (
                    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                      Voucher hanya bisa dipakai jika checkout berisi produk dari
                      satu seller. Untuk banyak seller, checkout produk per
                      seller agar kode voucher bisa digunakan.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                        <Input
                          value={voucherCode}
                          onChange={(event) =>
                            setVoucherCode(event.target.value.toUpperCase())
                          }
                          placeholder="Masukkan kode voucher, contoh: REVIBE10"
                          disabled={checkingVoucher || submitting}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          disabled={checkingVoucher || submitting}
                          onClick={handleApplyVoucher}
                        >
                          {checkingVoucher ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <TicketPercent className="mr-2 h-4 w-4" />
                          )}
                          Terapkan
                        </Button>

                        {appliedVoucher ? (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={checkingVoucher || submitting}
                            onClick={clearVoucher}
                          >
                            Hapus
                          </Button>
                        ) : null}
                      </div>

                      {appliedVoucher ? (
                        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
                          Voucher <b>{appliedVoucher.code}</b> berhasil
                          diterapkan. Diskon:{" "}
                          <b>{formatIDR(appliedVoucher.discount_amount)}</b>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Kode voucher divalidasi berdasarkan seller dan subtotal
                          produk sebelum ongkir.
                        </div>
                      )}
                    </div>
                  )}
                </CheckoutSection>

                <CheckoutSection
                  title="Catatan Pesanan"
                  description="Opsional. Tambahkan instruksi untuk penjual."
                  icon={<AlertCircle className="h-5 w-5 text-primary" />}
                >
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Contoh: tolong packing rapi, hubungi via WhatsApp sebelum dikirim."
                    rows={3}
                  />
                </CheckoutSection>
              </div>

              <aside className="h-fit rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Ringkasan</h2>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <SummaryRow
                    label="Jumlah Produk"
                    value={`${items.length} item`}
                  />

                  <SummaryRow
                    label="Subtotal Produk"
                    value={formatIDR(subtotal)}
                  />

                  <SummaryRow
                    label={`Ongkir (${Math.max(groupedBySeller.length, 1)} seller)`}
                    value={formatIDR(shippingCost)}
                  />

                  {appliedVoucher ? (
                    <SummaryRow
                      label={`Diskon Voucher (${appliedVoucher.code})`}
                      value={`- ${formatIDR(voucherDiscount)}`}
                    />
                  ) : null}

                  <SummaryRow
                    label="Metode Bayar"
                    value={paymentMethodLabel(paymentMethod)}
                  />

                  <SummaryRow label="Pengiriman" value={shippingMethod} />

                  <div className="border-t border-border pt-3">
                    <SummaryRow label="Total" value={formatIDR(total)} strong />
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-accent p-4 text-sm">
                  <div className="font-medium">Alamat dikirim ke:</div>

                  <div className="mt-1 text-muted-foreground">
                    {shippingAddress || "Alamat belum dipilih/diisi."}
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={
                    submitting ||
                    loading ||
                    items.length === 0 ||
                    hasStockProblem ||
                    !shippingAddress.trim()
                  }
                  onClick={handleSubmitCheckout}
                  className="mt-6 w-full gradient-brand text-white"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Bayar Sekarang
                </Button>

                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                >
                  <a href="/keranjang">Kembali ke Keranjang</a>
                </Button>

                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs leading-6 text-primary">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                    <div>
                      Stok dikunci langsung di database saat checkout. Voucher
                      divalidasi sebelum order dibuat dan disimpan ke order jika
                      berhasil.
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CheckoutSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">{icon}</div>

        <div>
          <h2 className="text-xl font-semibold">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function CheckoutProductCard({
  item,
  updating,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onRemove,
}: {
  item: CheckoutItem;
  updating: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const isStockProblem = !isItemAvailable(item);

  function handleQuantityInput(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = Number(event.target.value);

    if (!Number.isFinite(nextValue)) return;

    onQuantityChange(Math.max(1, Math.floor(nextValue)));
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${isStockProblem
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-background"
        }`}
    >
      <div className="grid gap-4 md:grid-cols-[96px_1fr]">
        <a
          href={`/detail-produk?id=${item.productId}`}
          className="h-24 w-24 overflow-hidden rounded-xl bg-muted"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
        </a>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={`/detail-produk?id=${item.productId}`}
                className="line-clamp-2 font-semibold hover:text-primary"
              >
                {item.title}
              </a>

              {item.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={updating}
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              {updating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Hapus
            </Button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="font-bold text-primary">
                {formatIDR(item.price)}
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                Stok tersedia: {item.stock} · Status:{" "}
                {productStatusLabel(item.status)}
              </div>

              {item.location ? (
                <div className="mt-1 text-sm text-muted-foreground">
                  Lokasi: {item.location}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={updating || item.quantity <= 1}
                onClick={onDecrease}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                type="number"
                min={1}
                max={item.stock}
                value={item.quantity}
                onChange={handleQuantityInput}
                disabled={updating}
                className="w-20 text-center"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={updating || item.quantity >= item.stock}
                onClick={onIncrease}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="text-sm text-muted-foreground">
              {item.quantity} x {formatIDR(item.price)}
            </div>

            <div className="font-semibold">
              {formatIDR(item.price * item.quantity)}
            </div>
          </div>

          {isStockProblem ? (
            <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Produk belum aktif, stok habis, atau jumlah melebihi stok.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AddressOptionCard({
  address,
  selected,
  onSelect,
}: {
  address: AddressOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition ${selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
          : "border-border bg-background hover:border-primary/40"
        }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold">
            {address.label || address.recipientName || "Alamat"}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {address.recipientName || "Penerima"}{" "}
            {address.phone ? `· ${address.phone}` : ""}
          </div>

          <div className="mt-2 text-sm leading-6">{address.fullAddress}</div>

          <div className="mt-2 text-xs text-muted-foreground">
            Sumber: {address.source}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {address.isDefault ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Utama
            </span>
          ) : null}

          {selected ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Dipilih
            </span>
          ) : (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Pilih
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyCheckout() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
      <Package className="mx-auto h-10 w-10 text-primary" />

      <h2 className="mt-4 text-xl font-semibold">Checkout kosong</h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Tidak ada produk yang bisa diproses di checkout.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild className="gradient-brand text-white">
          <a href="/produk">Mulai Belanja</a>
        </Button>

        <Button asChild variant="outline">
          <a href="/keranjang">Buka Keranjang</a>
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>

      <span className={strong ? "text-lg font-bold text-primary" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

async function loadBuyerAddressOptions(
  buyerId: string,
  profile: BuyerProfile | null,
): Promise<AddressOption[]> {
  const options: AddressOption[] = [];

  const profileAddress = buildProfileAddressOption(profile);

  if (profileAddress) {
    options.push(profileAddress);
  }

  const addressTables = [
    "buyer_addresses",
    "shipping_addresses",
    "user_addresses",
    "addresses",
  ];

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

async function readAddressRows(
  tableName: string,
  columnName: string,
  userId: string,
) {
  try {
    const { data, error } = await db
      .from(tableName)
      .select("*")
      .eq(columnName, userId);

    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

function buildProfileAddressOption(profile: BuyerProfile | null) {
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
    source: "Profil",
  };
}

function buildProfileAddress(profile: BuyerProfile | null) {
  if (!profile) return "";

  const address = String(profile.address ?? "").trim();
  const city = String(profile.city ?? "").trim();

  return [address, city].filter(Boolean).join(", ");
}

function normalizeAddressRow(row: any, source: string): AddressOption | null {
  const id = String(row.id ?? `${source}-${Math.random()}`);

  const label = String(
    row.label ??
    row.name ??
    row.title ??
    row.address_label ??
    row.type ??
    "Alamat Tersimpan",
  );

  const recipientName = String(
    row.recipient_name ??
    row.receiver_name ??
    row.full_name ??
    row.name ??
    row.contact_name ??
    row.nama_penerima ??
    "Pembeli",
  );

  const phone = String(
    row.phone ??
    row.phone_number ??
    row.whatsapp ??
    row.recipient_phone ??
    row.receiver_phone ??
    row.no_hp ??
    "",
  );

  const directFullAddress = String(
    row.full_address ??
    row.complete_address ??
    row.alamat_lengkap ??
    "",
  ).trim();

  const address = String(
    row.address ??
    row.detail_address ??
    row.street_address ??
    row.address_line ??
    row.address_line1 ??
    row.alamat ??
    "",
  ).trim();

  const district = String(
    row.district ?? row.subdistrict ?? row.kecamatan ?? "",
  ).trim();

  const city = String(row.city ?? row.kota ?? row.regency ?? "").trim();

  const province = String(row.province ?? row.provinsi ?? "").trim();

  const postalCode = String(
    row.postal_code ?? row.zip_code ?? row.kode_pos ?? "",
  ).trim();

  const fullAddress =
    directFullAddress ||
    [address, district, city, province, postalCode].filter(Boolean).join(", ");

  if (!fullAddress) return null;

  return {
    id,
    label,
    recipientName,
    phone,
    fullAddress,
    isDefault: Boolean(row.is_default ?? row.is_primary ?? false),
    source,
  };
}

function dedupeAddressOptions(options: AddressOption[]) {
  const seen = new Set<string>();
  const result: AddressOption[] = [];

  options.forEach((option) => {
    const key = `${option.fullAddress}|${option.phone}`.toLowerCase();

    if (seen.has(key)) return;

    seen.add(key);
    result.push(option);
  });

  return result;
}

function normalizeCheckoutItem(
  row: CartItemRow,
  source: "cart" | "buy_now",
): CheckoutItem | null {
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
    source,
  };
}

function normalizeProduct(value: ProductRow | ProductRow[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeVoucherResult(value: any): AppliedVoucher {
  return {
    ok: Boolean(value?.ok),
    voucher_id: String(value?.voucher_id ?? ""),
    code: String(value?.code ?? ""),
    name: String(value?.name ?? ""),
    discount_type:
      value?.discount_type === "percent" || value?.discount_type === "fixed"
        ? value.discount_type
        : "fixed",
    discount_value: Number(value?.discount_value ?? 0),
    discount_amount: Number(value?.discount_amount ?? 0),
    message: String(value?.message ?? ""),
  };
}

function getCheckoutItemKey(item: CheckoutItem) {
  return `${item.cartItemId || "direct"}-${item.productId}`;
}

function isItemAvailable(item: CheckoutItem) {
  return (
    ["approved", "active"].includes(String(item.status ?? "")) &&
    item.stock > 0 &&
    item.quantity > 0 &&
    item.quantity <= item.stock
  );
}

function productStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    approved: "Aktif",
    active: "Aktif",
    pending: "Menunggu Verifikasi",
    rejected: "Ditolak",
    inactive: "Nonaktif",
  };

  return labels[String(status ?? "")] ?? status ?? "-";
}

function paymentMethodLabel(method: string | null) {
  const labels: Record<string, string> = {
    cod: "COD",
    transfer_bank: "Transfer Bank",
    bank_transfer: "Transfer Bank",
    qris: "QRIS",
  };

  return labels[String(method ?? "")] ?? method ?? "-";
}

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}