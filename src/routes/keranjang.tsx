import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

const db = supabase as any;

export const Route = createFileRoute("/keranjang")({
  component: CartPage,
});

type CartRow = {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    seller_id: string;
    title: string;
    description: string | null;
    price: number | string;
    original_price: number | string | null;
    stock: number;
    images: string[] | null;
    status: string;
    location: string | null;
  } | null;
};

function CartPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadCart() {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await db
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
            original_price,
            stock,
            images,
            status,
            location
          )
        `,
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setItems((data ?? []) as CartRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat keranjang.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();

    function handleCartUpdated() {
      loadCart();
    }

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [user?.id]);

  const validItems = items.filter((item) => item.products);
  const subtotal = useMemo(() => {
    return validItems.reduce((sum, item) => {
      return sum + Number(item.products?.price ?? 0) * Number(item.quantity);
    }, 0);
  }, [validItems]);

  async function updateQuantity(item: CartRow, nextQuantity: number) {
    if (!user?.id) return;

    const stock = Number(item.products?.stock ?? 0);

    if (nextQuantity <= 0) {
      await removeItem(item);
      return;
    }

    if (nextQuantity > stock) {
      toast.error("Jumlah melebihi stok produk.");
      return;
    }

    setUpdatingId(item.id);

    try {
      const { error } = await db
        .from("cart_items")
        .update({
          quantity: nextQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("buyer_id", user.id);

      if (error) throw new Error(error.message);

      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah jumlah.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(item: CartRow) {
    if (!user?.id) return;

    setUpdatingId(item.id);

    try {
      const { error } = await db
        .from("cart_items")
        .delete()
        .eq("id", item.id)
        .eq("buyer_id", user.id);

      if (error) throw new Error(error.message);

      toast.success("Produk dihapus dari keranjang.");
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus produk.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">Keranjang Belanja</h1>

              <p className="mt-2 text-muted-foreground">
                Silakan login sebagai pembeli untuk melihat keranjang.
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
          <div>
            <h1 className="text-3xl font-bold">Keranjang Belanja</h1>

            <p className="mt-1 text-muted-foreground">
              Produk yang kamu pilih sebelum checkout.
            </p>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : validItems.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-primary" />

              <h2 className="mt-4 text-xl font-semibold">
                Keranjang masih kosong
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Tambahkan produk terlebih dahulu dari halaman produk.
              </p>

              <Button asChild className="mt-6 gradient-brand text-white">
                <a href="/produk">Belanja Sekarang</a>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {validItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    updating={updatingId === item.id}
                    onDecrease={() => updateQuantity(item, item.quantity - 1)}
                    onIncrease={() => updateQuantity(item, item.quantity + 1)}
                    onChangeQuantity={(value) => updateQuantity(item, value)}
                    onRemove={() => removeItem(item)}
                  />
                ))}
              </div>

              <div className="h-fit rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Ringkasan Belanja</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Produk
                    </span>
                    <span className="font-medium">{validItems.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatIDR(subtotal)}</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-5">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatIDR(subtotal)}</span>
                  </div>
                </div>

                <Button
                  asChild
                  className="mt-6 w-full gradient-brand text-white"
                >
                  <a href="/checkout">Lanjut Checkout</a>
                </Button>

                <Button asChild variant="outline" className="mt-3 w-full">
                  <a href="/produk">Tambah Produk Lagi</a>
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CartItemCard({
  item,
  updating,
  onDecrease,
  onIncrease,
  onChangeQuantity,
  onRemove,
}: {
  item: CartRow;
  updating: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onChangeQuantity: (value: number) => void;
  onRemove: () => void;
}) {
  const product = item.products!;
  const image = product.images?.[0];
  const price = Number(product.price ?? 0);
  const stock = Number(product.stock ?? 0);
  const lineTotal = price * Number(item.quantity);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
        <a
          href={`/detail-produk?id=${product.id}`}
          className="h-28 w-full overflow-hidden rounded-xl bg-muted md:w-28"
        >
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Tidak ada foto
            </div>
          )}
        </a>

        <div className="min-w-0">
          <a href={`/detail-produk?id=${product.id}`}>
            <h2 className="line-clamp-1 font-semibold hover:text-primary">
              {product.title}
            </h2>
          </a>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.description || "Tidak ada deskripsi."}
          </p>

          <div className="mt-3 text-sm text-muted-foreground">
            Stok tersedia: {stock}
          </div>

          <div className="mt-2 font-bold text-primary">
            {formatIDR(price)}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:w-44">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={updating}
              onClick={onDecrease}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Input
              type="number"
              min={1}
              max={stock}
              value={item.quantity}
              onChange={(event) =>
                onChangeQuantity(Number(event.target.value || 1))
              }
              className="text-center"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={updating}
              onClick={onIncrease}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-right text-sm">
            <div className="text-muted-foreground">Subtotal</div>
            <div className="font-bold">{formatIDR(lineTotal)}</div>
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={updating}
            onClick={onRemove}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
