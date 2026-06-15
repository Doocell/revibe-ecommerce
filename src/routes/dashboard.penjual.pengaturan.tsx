import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Settings, Store, UserRound } from "lucide-react";

export const Route = createFileRoute("/dashboard/penjual/pengaturan")({
  component: () => (
    <RoleGuard required="seller">
      <SellerSettingsPage />
    </RoleGuard>
  ),
});

function SellerSettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div>
            <h1 className="text-3xl font-bold">Pengaturan Seller</h1>

            <p className="mt-1 text-muted-foreground">
              Pusat pengaturan akun seller dan toko.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SettingCard
              title="Profil Toko"
              description="Edit nama toko, logo, lokasi, dan deskripsi toko."
              href="/dashboard/penjual/profil-toko"
              icon={Store}
            />

            <SettingCard
              title="Profil Akun"
              description="Edit nama, WhatsApp, foto profil, alamat, dan bio."
              href="/profil"
              icon={UserRound}
            />

            <SettingCard
              title="Chat Buyer"
              description="Buka halaman percakapan dengan buyer."
              href="/chat"
              icon={MessageCircle}
            />

            <SettingCard
              title="Notifikasi"
              description="Lihat semua notifikasi order, pembayaran, dan chat."
              href="/notifikasi"
              icon={Bell}
            />
          </div>

          <div className="mt-8">
            <Button asChild variant="outline">
              <a href="/dashboard/penjual">Kembali ke Dashboard</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SettingCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof Settings;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="rounded-2xl bg-primary/10 p-3 text-primary inline-flex">
        <Icon className="h-6 w-6" />
      </div>

      <h2 className="mt-4 font-semibold">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </a>
  );
}