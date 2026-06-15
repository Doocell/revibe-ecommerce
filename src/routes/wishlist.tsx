import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  conditionLabel,
  formatIDR,
  getBuyerWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  component: () => (
    <RoleGuard required="buyer">
      <WishlistPage />
    </RoleGuard>
  ),
});

function WishlistPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingProductId, setRemovingProductId] = useState<string | null>(
    null,
  );

  async function loadWishlist() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const rows = await getBuyerWishlist(user.id);
      setItems(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat wishlist.",
      );
      console.error("[Load Wishlist Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, [user]);

  async function handleRemove(productId: string) {
    if (!user) return;

    const confirmed = window.confirm(
      "Hapus produk ini dari wishlist?",
    );

    if (!confirmed) return;

    setRemovingProductId(productId);

    try {
      await removeFromWishlist({
        buyerId: user.id,
        productId,
      });

      setItems((current) =>
        current.filter((item) => item.product_id !== productId),
      );

      toast.success("Produk dihapus dari wishlist.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menghapus produk dari wishlist.",
      );
      console.error("[Remove Wishlist Error]", error);
    } finally {
      setRemovingProductId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Wishlist</h1>
              <p className="mt-1 text-muted-foreground">
                Produk favorit yang kamu simpan untuk dibeli nanti.
              </p>
            </div>

            <Button asChild className="gradient-brand text-white">
              <a href="/produk">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Cari Produk
              </a>
            </Button>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <EmptyWishlist />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {items.map((item) =>
                  item.products ? (
                    <WishlistCard
                      key={item.id}
                      item={item}
                      removing={removingProductId === item.product_id}
                      onRemove={() => handleRemove(item.product_id)}
                    />
                  ) : null,
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function WishlistCard({
  item,
  removing,
  onRemove,
}: {
  item: WishlistItem;
  removing: boolean;
  onRemove: () => void;
}) {
  const product = item.products;

  if (!product) return null;

  const image = product.images?.[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <a href={`/detail-produk?id=${product.id}`} className="block aspect-square bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No Image
          </div>
        )}
      </a>

      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground">
            {product.categories?.name ?? "Tanpa kategori"}
          </span>

          <span className="rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground">
            {conditionLabel(product.condition)}
          </span>
        </div>

        <a
          href={`/detail-produk?id=${product.id}`}
          className="line-clamp-2 min-h-12 font-semibold hover:text-primary"
        >
          {product.title}
        </a>

        <div className="mt-2 text-lg font-bold text-primary">
          {formatIDR(Number(product.price))}
        </div>

        {product.original_price &&
        Number(product.original_price) > Number(product.price) ? (
          <div className="text-sm text-muted-foreground line-through">
            {formatIDR(Number(product.original_price))}
          </div>
        ) : null}

        <div className="mt-1 text-xs text-muted-foreground">
          Stok: {product.stock} · {product.location || "Indonesia"}
        </div>

        <div className="mt-4 grid gap-2">
          <Button asChild className="gradient-brand text-white">
            <a href={`/detail-produk?id=${product.id}`}>Lihat Detail</a>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={removing}
            onClick={onRemove}
          >
            {removing ? (
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

function EmptyWishlist() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Heart className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-lg font-semibold">Wishlist masih kosong</h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Simpan produk favorit dari halaman detail produk agar mudah ditemukan
        lagi.
      </p>

      <Button asChild className="mt-6 gradient-brand text-white">
        <a href="/produk">Lihat Produk</a>
      </Button>
    </div>
  );
}
