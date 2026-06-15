import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getMySellerProfile,
  updateMySellerProfile,
  type SellerProfile,
  type SellerProfilePayload,
} from "@/lib/seller-profile";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Save,
  Store,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/penjual/profil-toko")({
  component: () => (
    <RoleGuard required="seller">
      <SellerShopProfilePage />
    </RoleGuard>
  ),
});

const emptyForm: SellerProfilePayload = {
  full_name: "",
  whatsapp: "",
  avatar_url: "",
  address: "",
  city: "",
  bio: "",
  shop_name: "",
  shop_description: "",
  shop_location: "",
  shop_logo_url: "",
};

function SellerShopProfilePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [form, setForm] = useState<SellerProfilePayload>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    setLoading(true);

    try {
      const row = await getMySellerProfile();

      setProfile(row);

      setForm({
        full_name: row.full_name,
        whatsapp: row.whatsapp,
        avatar_url: row.avatar_url,
        address: row.address,
        city: row.city,
        bio: row.bio,
        shop_name: row.shop_name,
        shop_description: row.shop_description,
        shop_location: row.shop_location,
        shop_logo_url: row.shop_logo_url,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat profil toko.",
      );

      console.error("[Load Seller Shop Profile Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField<K extends keyof SellerProfilePayload>(
    key: K,
    value: SellerProfilePayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.shop_name.trim()) {
      toast.error("Nama toko wajib diisi.");
      return;
    }

    if (!form.shop_location.trim()) {
      toast.error("Lokasi toko wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await updateMySellerProfile(form);

      setProfile(updatedProfile);

      toast.success("Profil toko berhasil disimpan.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan profil toko.",
      );

      console.error("[Save Seller Shop Profile Error]", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
              <h1 className="text-3xl font-bold">Profil Toko</h1>

              <p className="mt-1 text-muted-foreground">
                Edit informasi toko penjual yang akan dilihat oleh pembeli.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/penjual">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard Penjual
                </a>
              </Button>

              {profile?.id ? (
                <Button asChild variant="outline">
                  <a href={`/toko/${profile.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Toko Publik
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-muted">
                    {form.shop_logo_url ? (
                      <img
                        src={form.shop_logo_url}
                        alt={form.shop_name || "Logo toko"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Store className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold">
                      {form.shop_name || "Nama toko belum diisi"}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {form.shop_location || "Lokasi toko belum diisi"}
                    </p>

                    {profile?.updated_at ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Terakhir diperbarui:{" "}
                        {new Date(profile.updated_at).toLocaleString("id-ID")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-accent p-4">
                  <h3 className="font-semibold">Preview Deskripsi</h3>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {form.shop_description ||
                      "Deskripsi toko belum diisi. Tulis penjelasan singkat tentang toko kamu."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {form.avatar_url ? (
                      <img
                        src={form.avatar_url}
                        alt={form.full_name || "Foto seller"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <UserRound className="h-7 w-7" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {form.full_name || "Nama seller belum diisi"}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {form.whatsapp || "Nomor WhatsApp belum diisi"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Informasi Toko</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Nama Toko</Label>

                    <Input
                      value={form.shop_name}
                      onChange={(event) =>
                        updateField("shop_name", event.target.value)
                      }
                      placeholder="Contoh: ReVibe Store"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Lokasi Toko</Label>

                    <Input
                      value={form.shop_location}
                      onChange={(event) =>
                        updateField("shop_location", event.target.value)
                      }
                      placeholder="Contoh: Bandung"
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>URL Logo Toko</Label>

                    <Input
                      value={form.shop_logo_url}
                      onChange={(event) =>
                        updateField("shop_logo_url", event.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>Deskripsi Toko</Label>

                    <Textarea
                      value={form.shop_description}
                      onChange={(event) =>
                        updateField("shop_description", event.target.value)
                      }
                      rows={5}
                      placeholder="Jelaskan jenis produk, keunggulan toko, dan informasi penting untuk pembeli."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Informasi Seller</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Nama Lengkap</Label>

                    <Input
                      value={form.full_name}
                      onChange={(event) =>
                        updateField("full_name", event.target.value)
                      }
                      placeholder="Nama lengkap seller"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Nomor WhatsApp</Label>

                    <Input
                      value={form.whatsapp}
                      onChange={(event) =>
                        updateField("whatsapp", event.target.value)
                      }
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Kota Seller</Label>

                    <Input
                      value={form.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      placeholder="Contoh: Bandung"
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>URL Foto Seller</Label>

                    <Input
                      value={form.avatar_url}
                      onChange={(event) =>
                        updateField("avatar_url", event.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>Alamat Seller</Label>

                    <Textarea
                      value={form.address}
                      onChange={(event) =>
                        updateField("address", event.target.value)
                      }
                      rows={3}
                      placeholder="Alamat seller atau lokasi operasional toko"
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>Bio Seller</Label>

                    <Textarea
                      value={form.bio}
                      onChange={(event) =>
                        updateField("bio", event.target.value)
                      }
                      rows={4}
                      placeholder="Ceritakan sedikit tentang seller atau toko"
                    />
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
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Simpan Profil Toko
                </Button>
              </div>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}