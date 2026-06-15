import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { dummyProducts, categories } from "@/data/products";
import hero from "@/assets/hero-preloved.jpeg";
import { Search, ShieldCheck, Recycle, Sparkles, Truck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const featured = dummyProducts.slice(0, 4);
  const latest = [...dummyProducts].reverse().slice(0, 4);
  const popular = [...dummyProducts].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-soft" aria-hidden />
          <div className="container relative mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div className="flex flex-col justify-center">
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <Recycle className="h-3.5 w-3.5" /> Marketplace Preloved #1 di Indonesia
              </span>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
                Belanja <span className="text-gradient-brand">preloved</span><br />
                lebih hemat & ramah bumi.
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
                Temukan ribuan barang bekas layak pakai dari penjual terpercaya. Aman, mudah, dan harga ramah di kantong.
              </p>

              <form className="mt-7 flex max-w-lg gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Cari pakaian, tas, elektronik…" className="h-12 pl-10" />
                </div>
                <Button type="submit" size="lg" className="gradient-brand text-white shadow-brand">
                  Cari
                </Button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gradient-brand text-white shadow-brand">
                  <Link to="/produk">Belanja Sekarang <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/register/penjual">Jual Barang Preloved</Link>
                </Button>
              </div>

              <div className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
                {[
                  { icon: ShieldCheck, label: "Pembayaran Aman" },
                  { icon: Truck, label: "Pengiriman Cepat" },
                  { icon: Sparkles, label: "Penjual Terverifikasi" },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center text-center text-muted-foreground">
                    <b.icon className="mb-1 h-5 w-5 text-primary" />
                    <span className="text-xs">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl gradient-brand opacity-15 blur-3xl" />
              <img
                src={hero}
                alt="Koleksi barang preloved ReVibe"
                width={1600}
                height={1200}
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-brand"
              />
            </div>
          </div>
        </section>

        {/* Filter Kategori */}
        <section className="border-y border-border bg-background">
          <div className="container mx-auto px-4 py-8">
            <h2 className="mb-5 text-lg font-semibold">Telusuri Kategori</h2>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/produk"
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-brand"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-2xl">{c.emoji}</div>
                  <span className="text-sm font-medium group-hover:text-primary">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Produk rekomendasi */}
        <ProductSection title="Rekomendasi Untukmu" subtitle="Pilihan editor minggu ini" items={featured} />
        {/* Populer */}
        <ProductSection title="Produk Populer" subtitle="Paling banyak terjual" items={popular} highlight />
        {/* Terbaru */}
        <ProductSection title="Produk Terbaru" subtitle="Baru saja ditambahkan" items={latest} />

        {/* Edukasi */}
        <section className="bg-accent/40 py-16">
          <div className="container mx-auto grid gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Kenapa memilih barang preloved?</h2>
              <p className="mt-4 text-muted-foreground">
                Setiap barang yang dipakai ulang berarti satu langkah kecil mengurangi limbah tekstil dan elektronik di Indonesia. Hemat budget, kurangi jejak karbon, temukan barang langka.
              </p>
              <Button asChild className="mt-6 gradient-brand text-white shadow-brand">
                <Link to="/tentang">Pelajari Lebih Lanjut</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "85%", t: "Lebih hemat dari harga baru" },
                { n: "2.5kg", t: "CO₂ dicegah per produk" },
                { n: "10k+", t: "Penjual terpercaya" },
                { n: "50k+", t: "Barang ditemukan rumah baru" },
              ].map((s) => (
                <div key={s.t} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-3xl font-extrabold text-gradient-brand">{s.n}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="overflow-hidden rounded-3xl gradient-brand p-10 text-white shadow-brand md:p-14">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">Punya barang nganggur di rumah?</h2>
                <p className="mt-3 text-white/85">
                  Ubah jadi cuan! Daftar sebagai penjual ReVibe dan jangkau ribuan pembeli setiap hari.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/register/penjual">Jual Barang Preloved</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link to="/produk">Belanja Sekarang</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ProductSection({
  title, subtitle, items, highlight,
}: { title: string; subtitle: string; items: typeof dummyProducts; highlight?: boolean }) {
  return (
    <section className={highlight ? "bg-muted/40 py-14" : "py-14"}>
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Link to="/produk" className="text-sm font-medium text-primary hover:underline">
            Lihat semua →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
