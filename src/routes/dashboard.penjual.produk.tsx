import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
    conditionLabel,
    formatIDR,
    getSellerProducts,
    productStatusLabel,
    updateSellerProductStatus,
    updateSellerProductStock,
    type SellerProduct,
} from "@/lib/seller-products";
import {
    ArrowLeft,
    Boxes,
    Loader2,
    PlusCircle,
    RefreshCw,
    Save,
    Search,
    XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/penjual/produk")({
    component: () => (
        <RoleGuard required="seller">
            <SellerProductsPage />
        </RoleGuard>
    ),
});

function SellerProductsPage() {
    const { user } = useAuth();

    const [products, setProducts] = useState<SellerProduct[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    async function loadProducts() {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const rows = await getSellerProducts(user.id);
            setProducts(rows);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Gagal memuat produk.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProducts();
    }, [user?.id]);

    const filteredProducts = products.filter((product) => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return true;

        return (
            product.title.toLowerCase().includes(keyword) ||
            String(product.description ?? "").toLowerCase().includes(keyword) ||
            String(product.location ?? "").toLowerCase().includes(keyword)
        );
    });

    async function handleInactive(product: SellerProduct) {
        if (!user) return;

        const confirmed = window.confirm(`Nonaktifkan produk ${product.title}?`);

        if (!confirmed) return;

        setUpdatingId(product.id);

        try {
            await updateSellerProductStatus({
                sellerId: user.id,
                productId: product.id,
                status: "inactive",
            });

            toast.success("Produk berhasil dinonaktifkan.");
            await loadProducts();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Gagal menonaktifkan produk.",
            );
        } finally {
            setUpdatingId(null);
        }
    }

    async function handleUpdateStock(product: SellerProduct, stock: number) {
        if (!user) return;

        setUpdatingId(product.id);

        try {
            await updateSellerProductStock({
                sellerId: user.id,
                productId: product.id,
                stock,
            });

            toast.success("Stok berhasil diperbarui.");
            await loadProducts();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Gagal memperbarui stok.",
            );
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="container mx-auto px-4 py-10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Produk Saya</h1>

                            <p className="mt-1 text-muted-foreground">
                                Kelola produk, stok, dan status verifikasi produk toko kamu.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline">
                                <a href="/dashboard/penjual">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Dashboard
                                </a>
                            </Button>

                            <Button asChild className="gradient-brand text-white">
                                <a href="/dashboard/penjual/produk/tambah">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Tambah Produk
                                </a>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={loadProducts}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-border bg-card p-5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari produk..."
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="mt-8">
                        {loading ? (
                            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                                <Boxes className="mx-auto h-10 w-10 text-primary" />

                                <h3 className="mt-4 text-lg font-semibold">
                                    Belum ada produk
                                </h3>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Tambahkan produk pertama kamu.
                                </p>

                                <Button asChild className="mt-6 gradient-brand text-white">
                                    <a href="/dashboard/penjual/produk/tambah">
                                        Tambah Produk
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredProducts.map((product) => (
                                    <SellerProductCard
                                        key={product.id}
                                        product={product}
                                        updating={updatingId === product.id}
                                        onInactive={() => handleInactive(product)}
                                        onUpdateStock={(stock) =>
                                            handleUpdateStock(product, stock)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function SellerProductCard({
    product,
    updating,
    onInactive,
    onUpdateStock,
}: {
    product: SellerProduct;
    updating: boolean;
    onInactive: () => void;
    onUpdateStock: (stock: number) => void;
}) {
    const [stock, setStock] = useState(String(product.stock ?? 0));
    const image = product.images?.[0];

    return (
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[120px_1fr_auto]">
            <div className="h-28 w-full overflow-hidden rounded-xl bg-muted md:w-28">
                {image ? (
                    <img
                        src={image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No Image
                    </div>
                )}
            </div>

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{product.title}</h3>

                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {productStatusLabel(product.status)}
                    </span>
                </div>

                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {product.description || "Tidak ada deskripsi."}
                </p>

                <div className="mt-3 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                    <div>
                        Harga:{" "}
                        <b className="text-foreground">{formatIDR(Number(product.price))}</b>
                    </div>
                    <div>Kondisi: {conditionLabel(product.condition)}</div>
                    <div>Kategori: {product.categories?.name ?? "-"}</div>
                    <div>Lokasi: {product.location ?? "-"}</div>
                    <div>Terjual: {product.sold ?? 0}</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 md:w-44 md:flex-col">
                <Input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                />

                <Button
                    type="button"
                    variant="outline"
                    disabled={updating}
                    onClick={() => onUpdateStock(Number(stock))}
                >
                    {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Simpan Stok
                </Button>

                {product.status !== "inactive" ? (
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={updating}
                        onClick={onInactive}
                    >
                        {updating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Nonaktifkan
                    </Button>
                ) : null}
            </div>
        </div>
    );
}