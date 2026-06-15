import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Recycle, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/tentang")({
  component: TentangPage,
  head: () => ({ meta: [{ title: "Tentang Kami — ReVibe" }, { name: "description", content: "Tentang ReVibe, marketplace barang preloved Indonesia yang aman, mudah, dan terpercaya." }] }),
});

function TentangPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-soft">
          <div className="container mx-auto px-4 py-16 text-center md:py-24">
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold md:text-5xl">
              Memberi kehidupan kedua pada <span className="text-gradient-brand">barang berkualitas</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
              ReVibe lahir dari satu keyakinan sederhana: barang bekas yang layak pakai pantas mendapat rumah baru, bukan tempat sampah.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Aman", d: "Verifikasi penjual & pembayaran aman." },
            { icon: Recycle, t: "Berkelanjutan", d: "Kurangi limbah, perpanjang siklus barang." },
            { icon: Heart, t: "Mudah", d: "Pengalaman belanja & jualan sederhana." },
            { icon: Users, t: "Terpercaya", d: "Komunitas pembeli & penjual aktif." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-border bg-card p-6">
              <v.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{v.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </section>

        <section className="bg-muted/40 py-16">
          <div className="container mx-auto grid gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">Misi Kami</h2>
              <p className="mt-4 text-muted-foreground">
                Membangun marketplace preloved Indonesia yang paling tepercaya — tempat penjual & pembeli bertemu tanpa drama, dengan harga yang adil dan dampak baik untuk lingkungan.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Visi Kami</h2>
              <p className="mt-4 text-muted-foreground">
                Menjadi pilihan utama keluarga Indonesia saat ingin membeli atau menjual barang preloved, sekaligus menormalkan gaya hidup berkelanjutan.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
