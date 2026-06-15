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
import { useAuth } from "@/lib/auth";
import {
  createBuyerAddress,
  deleteBuyerAddress,
  getBuyerAddresses,
  setDefaultBuyerAddress,
  updateBuyerAddress,
  type BuyerAddress,
} from "@/lib/buyer-addresses";
import {
  CheckCircle2,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/alamat")({
  component: () => (
    <RoleGuard required="buyer">
      <AddressPage />
    </RoleGuard>
  ),
});

type PostalRegion = {
  code: number | string;
  village: string;
  district: string;
  regency: string;
  province: string;
};

type AddressForm = {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  district: string;
  village: string;
  postal_code: string;
  notes: string;
  is_default: boolean;
};

const emptyForm: AddressForm = {
  recipient_name: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  district: "",
  village: "",
  postal_code: "",
  notes: "",
  is_default: false,
};

function AddressPage() {
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [regionSearch, setRegionSearch] = useState("");
  const [regionResults, setRegionResults] = useState<PostalRegion[]>([]);
  const [searchingRegion, setSearchingRegion] = useState(false);
  const [regionTouched, setRegionTouched] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadAddresses() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const rows = await getBuyerAddresses(user.id);
      setAddresses(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat alamat.",
      );

      console.error("[Load Buyer Addresses Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, [user]);

  useEffect(() => {
    const keyword = regionSearch.trim();

    if (!regionTouched || keyword.length < 3) {
      setRegionResults([]);
      setSearchingRegion(false);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setSearchingRegion(true);

      try {
        const response = await fetch(
          `https://kodepos.vercel.app/search/?q=${encodeURIComponent(keyword)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Gagal mencari wilayah.");
        }

        const json = await response.json();

        const rows = Array.isArray(json?.data) ? json.data : [];

        const mappedRows = rows
          .map((item: any) => ({
            code: item.code,
            village: String(item.village ?? "").trim(),
            district: String(item.district ?? "").trim(),
            regency: String(item.regency ?? "").trim(),
            province: String(item.province ?? "").trim(),
          }))
          .filter((item: PostalRegion) => {
            return (
              item.code &&
              item.village &&
              item.district &&
              item.regency &&
              item.province
            );
          })
          .slice(0, 30);

        setRegionResults(mappedRows);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[Search Postal Region Error]", error);
          setRegionResults([]);
        }
      } finally {
        setSearchingRegion(false);
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [regionSearch, regionTouched]);

  function updateField<K extends keyof AddressForm>(
    key: K,
    value: AddressForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function selectRegion(region: PostalRegion) {
    setForm((current) => ({
      ...current,
      province: region.province,
      city: region.regency,
      district: region.district,
      village: region.village,
      postal_code: String(region.code),
    }));

    setRegionSearch(
      `${region.village}, ${region.district}, ${region.regency}, ${region.province} ${region.code}`,
    );

    setRegionResults([]);
    setRegionTouched(false);
  }

  function clearRegion() {
    setForm((current) => ({
      ...current,
      province: "",
      city: "",
      district: "",
      village: "",
      postal_code: "",
    }));

    setRegionSearch("");
    setRegionResults([]);
    setRegionTouched(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingAddressId(null);
    setRegionSearch("");
    setRegionResults([]);
    setRegionTouched(false);
  }

  function startEdit(address: BuyerAddress) {
    setEditingAddressId(address.id);

    setForm({
      recipient_name: address.recipient_name ?? "",
      phone: address.phone ?? "",
      address: address.address ?? "",
      city: address.city ?? "",
      province: address.province ?? "",
      district: address.district ?? "",
      village: address.village ?? "",
      postal_code: address.postal_code ?? "",
      notes: address.notes ?? "",
      is_default: Boolean(address.is_default),
    });

    const regionLabel = [
      address.village,
      address.district,
      address.city,
      address.province,
      address.postal_code,
    ]
      .filter(Boolean)
      .join(", ");

    setRegionSearch(regionLabel);
    setRegionResults([]);
    setRegionTouched(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    if (!form.village || !form.district || !form.city || !form.province) {
      toast.error("Pilih kelurahan/desa dari hasil pencarian wilayah.");
      return;
    }

    setSaving(true);

    try {
      if (editingAddressId) {
        await updateBuyerAddress({
          addressId: editingAddressId,
          buyerId: user.id,
          payload: form,
        });

        toast.success("Alamat berhasil diperbarui.");
      } else {
        await createBuyerAddress({
          buyer_id: user.id,
          ...form,
          is_default: form.is_default || addresses.length === 0,
        });

        toast.success("Alamat berhasil ditambahkan.");
      }

      resetForm();
      await loadAddresses();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan alamat.",
      );

      console.error("[Save Buyer Address Error]", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(addressId: string) {
    if (!user) return;

    const confirmed = window.confirm("Hapus alamat ini?");

    if (!confirmed) return;

    setUpdatingId(addressId);

    try {
      await deleteBuyerAddress({
        addressId,
        buyerId: user.id,
      });

      toast.success("Alamat berhasil dihapus.");
      await loadAddresses();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus alamat.",
      );

      console.error("[Delete Buyer Address Error]", error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSetDefault(addressId: string) {
    if (!user) return;

    setUpdatingId(addressId);

    try {
      await setDefaultBuyerAddress({
        addressId,
        buyerId: user.id,
      });

      toast.success("Alamat utama berhasil diperbarui.");
      await loadAddresses();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengatur alamat utama.",
      );

      console.error("[Set Default Address Error]", error);
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
              <h1 className="text-3xl font-bold">Alamat Pengiriman</h1>

              <p className="mt-1 text-muted-foreground">
                Simpan alamat pengiriman agar proses checkout lebih cepat.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/pembeli">Dashboard Pembeli</a>
              </Button>

              <Button asChild className="gradient-brand text-white">
                <a href="/checkout">Ke Checkout</a>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2">
                {editingAddressId ? (
                  <Edit className="h-5 w-5 text-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-primary" />
                )}

                <h2 className="text-lg font-semibold">
                  {editingAddressId ? "Edit Alamat" : "Tambah Alamat"}
                </h2>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-2">
                  <Label>Nama Penerima</Label>

                  <Input
                    value={form.recipient_name}
                    onChange={(event) =>
                      updateField("recipient_name", event.target.value)
                    }
                    placeholder="Nama penerima"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Nomor HP</Label>

                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Alamat Lengkap</Label>

                  <Textarea
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    rows={4}
                    placeholder="Nama jalan, nomor rumah, RT/RW, detail patokan"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Cari Kelurahan / Kecamatan / Kota</Label>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                    <Input
                      value={regionSearch}
                      onChange={(event) => {
                        setRegionTouched(true);
                        setRegionSearch(event.target.value);
                      }}
                      placeholder="Contoh: Kebayoran Baru, Menteng, Bandung"
                      className="pl-9"
                    />

                    {regionSearch ? (
                      <button
                        type="button"
                        onClick={clearRegion}
                        className="absolute right-3 top-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Ketik minimal 3 huruf, lalu pilih hasil yang sesuai agar
                    kecamatan, kelurahan, dan kode pos terisi otomatis.
                  </p>

                  {searchingRegion ? (
                    <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                      Mencari wilayah...
                    </div>
                  ) : regionResults.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-background p-2">
                      {regionResults.map((region, index) => (
                        <button
                          key={`${region.code}-${region.village}-${region.district}-${index}`}
                          type="button"
                          onClick={() => selectRegion(region)}
                          className="block w-full rounded-lg px-3 py-3 text-left text-sm transition hover:bg-accent"
                        >
                          <div className="font-semibold">
                            {region.village}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Kec. {region.district}, {region.regency},{" "}
                            {region.province}
                          </div>

                          <div className="mt-1 text-xs font-medium text-primary">
                            Kode Pos: {region.code}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : regionTouched && regionSearch.trim().length >= 3 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Wilayah tidak ditemukan. Coba gunakan kata kunci lain,
                      misalnya nama kelurahan atau kecamatan.
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <ReadOnlyField label="Provinsi" value={form.province} />
                  <ReadOnlyField label="Kota/Kabupaten" value={form.city} />
                  <ReadOnlyField label="Kecamatan" value={form.district} />
                  <ReadOnlyField label="Kelurahan/Desa" value={form.village} />
                </div>

                <div className="grid gap-2">
                  <Label>Kode Pos</Label>

                  <Input
                    value={form.postal_code}
                    readOnly
                    placeholder="Otomatis setelah kelurahan/desa dipilih"
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Catatan</Label>

                  <Textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                    rows={3}
                    placeholder="Contoh: rumah pagar hitam"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(event) =>
                      updateField("is_default", event.target.checked)
                    }
                  />

                  Jadikan alamat utama
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
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
                  Simpan Alamat
                </Button>

                {editingAddressId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal Edit
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Daftar Alamat</h2>

                  <p className="text-sm text-muted-foreground">
                    Pilih satu alamat sebagai alamat utama.
                  </p>
                </div>

                <MapPin className="h-6 w-6 text-primary" />
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <MapPin className="mx-auto h-9 w-9 text-primary" />

                    <h3 className="mt-3 font-semibold">
                      Belum ada alamat tersimpan
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Tambahkan alamat agar checkout lebih cepat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        loading={updatingId === address.id}
                        onEdit={() => startEdit(address)}
                        onDelete={() => handleDelete(address.id)}
                        onSetDefault={() => handleSetDefault(address.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>

      <Input
        value={value}
        readOnly
        placeholder="Otomatis"
        className="bg-muted"
      />
    </div>
  );
}

function AddressCard({
  address,
  loading,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: BuyerAddress;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{address.recipient_name}</h3>

            {address.is_default ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3 w-3" />
                Utama
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!address.is_default ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={onSetDefault}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              Jadikan Utama
            </Button>
          ) : null}

          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={onDelete}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Hapus
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-accent p-3 text-sm">
        <div>{address.address}</div>

        <div className="mt-2 text-muted-foreground">
          {[
            address.village ? `Kel. ${address.village}` : "",
            address.district ? `Kec. ${address.district}` : "",
            address.city,
            address.province,
            address.postal_code,
          ]
            .filter(Boolean)
            .join(", ") || "-"}
        </div>

        {address.notes ? (
          <div className="mt-2 text-muted-foreground">
            Catatan: {address.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}