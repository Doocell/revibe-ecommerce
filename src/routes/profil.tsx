import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  getMyProfile,
  updateMyProfile,
  type UserProfile,
} from "@/lib/profile";
import {
  Loader2,
  Save,
  Store,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/profil")({
  component: ProfilePage,
});

type ProfileForm = {
  full_name: string;
  whatsapp: string;
  avatar_url: string;
  address: string;
  city: string;
  bio: string;
  shop_name: string;
  shop_description: string;
  shop_location: string;
  shop_logo_url: string;
};

const emptyForm: ProfileForm = {
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

function ProfilePage() {
  const { user, roles, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const safeRoles = roles ?? [];
  const isSeller = safeRoles.includes("seller");

  async function loadProfile() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const row = await getMyProfile(user.id);

      setProfile(row);

      setForm({
        full_name: row.full_name ?? "",
        whatsapp: row.whatsapp ?? "",
        avatar_url: row.avatar_url ?? "",
        address: row.address ?? "",
        city: row.city ?? "",
        bio: row.bio ?? "",
        shop_name: row.shop_name ?? "",
        shop_description: row.shop_description ?? "",
        shop_location: row.shop_location ?? "",
        shop_logo_url: row.shop_logo_url ?? "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat profil.",
      );

      console.error("[Load Profile Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [authLoading, user]);

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await updateMyProfile(user.id, form);

      setProfile(updatedProfile);

      toast.success("Profil berhasil diperbarui.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan profil.",
      );

      console.error("[Save Profile Error]", error);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <UserRound className="mx-auto h-10 w-10 text-primary" />

              <h1 className="mt-4 text-2xl font-bold">Profil Saya</h1>

              <p className="mt-2 text-muted-foreground">
                Silakan login terlebih dahulu untuk mengelola profil.
              </p>

              <Button asChild className="mt-6 gradient-brand text-white">
                <a href="/login/pembeli">Login</a>
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Profil Saya</h1>

              <p className="mt-1 text-muted-foreground">
                Kelola identitas akun, kontak, alamat, dan informasi toko.
              </p>
            </div>

            {isSeller ? (
              <Button asChild variant="outline">
                <a href={`/toko/${user.id}`}>
                  <Store className="mr-2 h-4 w-4" />
                  Lihat Toko Publik
                </a>
              </Button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {form.avatar_url ? (
                      <img
                        src={form.avatar_url}
                        alt={form.full_name || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <UserRound className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">
                      {form.full_name || "Nama belum diisi"}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {safeRoles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {profile?.updated_at ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Terakhir diperbarui:{" "}
                    {new Date(profile.updated_at).toLocaleString("id-ID")}
                  </p>
                ) : null}
              </div>

              {isSeller ? (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      {form.shop_logo_url ? (
                        <img
                          src={form.shop_logo_url}
                          alt={form.shop_name || "Logo toko"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Store className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        {form.shop_name || "Nama toko belum diisi"}
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {form.shop_location || "Lokasi toko belum diisi"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Informasi Akun</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Nama Lengkap</Label>

                    <Input
                      value={form.full_name}
                      onChange={(event) =>
                        updateField("full_name", event.target.value)
                      }
                      placeholder="Nama lengkap"
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

                  <div className="grid gap-2 md:col-span-2">
                    <Label>URL Foto Profil</Label>

                    <Input
                      value={form.avatar_url}
                      onChange={(event) =>
                        updateField("avatar_url", event.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Kota</Label>

                    <Input
                      value={form.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      placeholder="Contoh: Bandung"
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>Alamat</Label>

                    <Textarea
                      value={form.address}
                      onChange={(event) =>
                        updateField("address", event.target.value)
                      }
                      rows={3}
                      placeholder="Alamat utama"
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label>Bio</Label>

                    <Textarea
                      value={form.bio}
                      onChange={(event) =>
                        updateField("bio", event.target.value)
                      }
                      rows={4}
                      placeholder="Ceritakan sedikit tentang kamu"
                    />
                  </div>
                </div>
              </div>

              {isSeller ? (
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
                        placeholder="Contoh: Jakarta Selatan"
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
                        rows={4}
                        placeholder="Jelaskan toko dan jenis produk yang dijual"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

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
                  Simpan Profil
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