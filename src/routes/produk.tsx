import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import {
  getApprovedProducts,
  getCategories,
  getCategorySlug,
  type CategoryRow,
  type ProductWithCategory,
} from "@/lib/products";

export const Route = createFileRoute("/produk")({
  component: ProdukPage,
  head: () => ({
    meta: [
      { title: "Produk Preloved — ReVibe" },
      {
        name: "description",
        content:
          "Jelajahi semua produk preloved di ReVibe: pakaian, tas, sepatu, elektronik, buku, aksesoris.",
      },
    ],
  }),
});

const conditions = [
  { value: "all", label: "Semua Kondisi" },
  { value: "like_new", label: "Seperti Baru" },
  { value: "very_good", label: "Sangat Baik" },
  { value: "good", label: "Baik" },
  { value: "fair", label: "Cukup" },
];

function ProdukPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [cond, setCond] = useState("all");
  const [max, setMax] = useState<number>(20000000);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [productRows, categoryRows] = await Promise.all([
          getApprovedProducts(),
          getCategories(),
        ]);

        if (!alive) return;

        setProducts(productRows);
        setCategories(categoryRows);
      } catch (err) {
        if (!alive) return;

        setError(err instanceof Error ? err.message : "Gagal memuat produk.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return products.filter((p) => {
      const categorySlug = getCategorySlug(p);
      const title = p.title.toLowerCase();
      const description = (p.description ?? "").toLowerCase();

      if (keyword && !title.includes(keyword) && !description.includes(keyword)) {
        return false;
      }

      if (cat !== "all" && categorySlug !== cat) return false;
      if (cond !== "all" && p.condition !== cond) return false;
      if (Number(p.price) > max) return false;

      return true;
    });
  }, [products, q, cat, cond, max]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold md:text-4xl">Produk Preloved</h1>
          <p className="mt-2 text-muted-foreground">
            Cari dan saring barang preloved yang sudah disetujui admin.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20 lg:h-fit">
              <div>
                <label className="mb-2 block text-sm font-semibold">Cari</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10"
                    placeholder="Cari produk…"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Kategori</label>
                <div className="space-y-1">
                  <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
                    Semua Kategori
                  </FilterChip>

                  {categories.map((c) => (
                    <FilterChip
                      key={c.id}
                      active={cat === c.slug}
                      onClick={() => setCat(c.slug)}
                    >
                      {c.name}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Kondisi</label>
                <div className="space-y-1">
                  {conditions.map((c) => (
                    <FilterChip
                      key={c.value}
                      active={cond === c.value}
                      onClick={() => setCond(c.value)}
                    >
                      {c.label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Harga Maksimum</label>
                <input
                  type="range"
                  min={50000}
                  max={20000000}
                  step={50000}
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                  className="w-full accent-[var(--brand-green)]"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Sampai Rp {new Intl.NumberFormat("id-ID").format(max)}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setQ("");
                  setCat("all");
                  setCond("all");
                  setMax(20000000);
                }}
              >
                Reset Filter
              </Button>
            </aside>

            <div>
              {loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {filtered.length} produk ditemukan
                  </div>

                  {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                      Belum ada produk yang cocok. Jika database masih kosong,
                      lanjutkan ke tahap upload produk penjual.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-primary font-medium text-primary-foreground"
          : "hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}