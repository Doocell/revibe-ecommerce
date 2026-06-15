import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  createSellerProduct,
  getSellerCategories,
  parseImageUrls,
  type SellerCategory,
} from "@/lib/seller-products";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/penjual/produk/tambah")({
  component: () => (
    <RoleGuard required="seller">
      <SellerAddProductPage />
    </RoleGuard>
  ),
});

function SellerAddProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  const [stock, setStock] = useState("1");
  const [imageUrls, setImageUrls] = useState("");

  async function loadCategories() {
    setLoading(true);

    try {
      const rows = await getSellerCategories();
      setCategories(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat kategori.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);

    try {
      await createSellerProduct({
        sellerId: user.id,
        title,
        description,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        category_id: categoryId || null,
        condition,
        location,
        stock: Number(stock),
        images: parseImageUrls(imageUrls),
      });

      toast.success("Produk berhasil ditambahkan dan menunggu verifikasi admin.");

      navigate({
        to: "/dashboard/penjual/produk",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menambahkan produk.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Tambah Produk</h1>

              <p className="mt-1 text-muted-foreground">
                Tambahkan produk preloved baru. Produk akan tampil setelah
                diverifikasi admin.
              </p>
            </div>

            <Button asChild variant="outline">
              <a href="/dashboard/penjual">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard Penjual
              </a>
            </Button>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
            >
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold">Informasi Produk</h2>

                  <div className="mt-5 grid gap-4">
                    <div className="grid gap-2">
                      <Label>Nama Produk</Label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Contoh: Jaket Denim Preloved"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Deskripsi Produk</Label>
                      <Textarea
                        value={description}
                        onChange={(event) =>
                          setDescription(event.target.value)
                        }
                        rows={5}
                        placeholder="Jelaskan kondisi, ukuran, minus, dan detail produk."
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Harga Jual</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(event) => setPrice(event.target.value)}
                          placeholder="100000"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Harga Awal / Coret</Label>
                        <Input
                          type="number"
                          value={originalPrice}
                          onChange={(event) =>
                            setOriginalPrice(event.target.value)
                          }
                          placeholder="150000"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Kategori</Label>
                        <select
                          value={categoryId}
                          onChange={(event) =>
                            setCategoryId(event.target.value)
                          }
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Pilih kategori</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Kondisi</Label>
                        <select
                          value={condition}
                          onChange={(event) =>
                            setCondition(event.target.value)
                          }
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="like_new">Seperti Baru</option>
                          <option value="very_good">Sangat Baik</option>
                          <option value="good">Baik</option>
                          <option value="fair">Cukup</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Lokasi Produk</Label>
                        <Input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          placeholder="Contoh: Bandung"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Stok</Label>
                        <Input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={(event) => setStock(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>URL Gambar Produk</Label>
                      <Textarea
                        value={imageUrls}
                        onChange={(event) => setImageUrls(event.target.value)}
                        rows={5}
                        placeholder={`https://contoh.com/foto-1.jpg\nhttps://contoh.com/foto-2.jpg`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Masukkan satu URL gambar per baris.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gradient-brand text-white"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Simpan Produk
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Preview Singkat</h2>

                <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
                  <div className="aspect-square bg-muted">
                    {parseImageUrls(imageUrls)[0] ? (
                      <img
                        src={parseImageUrls(imageUrls)[0]}
                        alt={title || "Preview produk"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Preview Gambar
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold">
                      {title || "Nama produk"}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {description || "Deskripsi produk akan tampil di sini."}
                    </p>

                    <div className="mt-3 font-bold text-primary">
                      Rp {Number(price || 0).toLocaleString("id-ID")}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Status awal: Menunggu Verifikasi Admin
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}