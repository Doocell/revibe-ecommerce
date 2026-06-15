import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { categories, dummyProducts } from "@/data/products";

export const Route = createFileRoute("/kategori")({
  component: KategoriPage,
  head: () => ({ meta: [{ title: "Kategori — ReVibe" }, { name: "description", content: "Telusuri seluruh kategori barang preloved di ReVibe." }] }),
});

function KategoriPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold md:text-4xl">Semua Kategori</h1>
          <p className="mt-2 text-muted-foreground">Pilih kategori untuk mulai berburu barang preloved favoritmu.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            {categories.map((c) => {
              const count = dummyProducts.filter((p) => p.category === c.slug).length;
              return (
                <Link
                  key={c.slug}
                  to="/produk"
                  className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-brand"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-3xl">{c.emoji}</div>
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-primary">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{count}+ produk tersedia</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
