import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  TicketPercent,
  Trash2,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const Route = createFileRoute("/voucher/penjual")({
  component: () => (
    <RoleGuard required="seller">
      <SellerVoucherPage />
    </RoleGuard>
  ),
});

type VoucherRow = {
  id: string;
  seller_id: string;
  code: string;
  name: string;
  discount_type: "fixed" | "percent";
  discount_value: number | string;
  min_order: number | string;
  max_discount: number | string | null;
  usage_limit: number | null;
  used_count: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

type VoucherForm = {
  code: string;
  name: string;
  discount_type: "fixed" | "percent";
  discount_value: string;
  min_order: string;
  max_discount: string;
  usage_limit: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const emptyForm: VoucherForm = {
  code: "",
  name: "",
  discount_type: "fixed",
  discount_value: "",
  min_order: "0",
  max_discount: "",
  usage_limit: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function SellerVoucherPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<VoucherRow[]>([]);
  const [form, setForm] = useState<VoucherForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadVouchers() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await db
        .from("vouchers")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setItems((data ?? []) as VoucherRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat voucher.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, [user?.id]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return items;

    return items.filter((item) => {
      return [
        item.code,
        item.name,
        item.discount_type,
        item.is_active ? "aktif" : "nonaktif",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, search]);

  function updateForm<K extends keyof VoucherForm>(key: K, value: VoucherForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editVoucher(item: VoucherRow) {
    setEditingId(item.id);

    setForm({
      code: item.code ?? "",
      name: item.name ?? "",
      discount_type: item.discount_type ?? "fixed",
      discount_value: String(item.discount_value ?? ""),
      min_order: String(item.min_order ?? "0"),
      max_discount: item.max_discount == null ? "" : String(item.max_discount),
      usage_limit: item.usage_limit == null ? "" : String(item.usage_limit),
      starts_at: item.starts_at ? toDateTimeLocal(item.starts_at) : "",
      ends_at: item.ends_at ? toDateTimeLocal(item.ends_at) : "",
      is_active: Boolean(item.is_active),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id) {
      toast.error("Seller tidak valid.");
      return;
    }

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const discountValue = Number(form.discount_value);
    const minOrder = Number(form.min_order || 0);
    const maxDiscount = form.max_discount ? Number(form.max_discount) : null;
    const usageLimit = form.usage_limit ? Number(form.usage_limit) : null;

    if (!code) {
      toast.error("Kode voucher wajib diisi.");
      return;
    }

    if (!name) {
      toast.error("Nama voucher wajib diisi.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      toast.error("Nilai diskon harus lebih dari 0.");
      return;
    }

    if (form.discount_type === "percent" && discountValue > 100) {
      toast.error("Diskon persen maksimal 100%.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        seller_id: user.id,
        code,
        name,
        discount_type: form.discount_type,
        discount_value: discountValue,
        min_order: Number.isFinite(minOrder) ? minOrder : 0,
        max_discount:
          maxDiscount !== null && Number.isFinite(maxDiscount)
            ? maxDiscount
            : null,
        usage_limit:
          usageLimit !== null && Number.isFinite(usageLimit)
            ? Math.floor(usageLimit)
            : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await db
          .from("vouchers")
          .update(payload)
          .eq("id", editingId)
          .eq("seller_id", user.id);

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Voucher berhasil diperbarui.");
      } else {
        const { error } = await db.from("vouchers").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Voucher berhasil dibuat.");
      }

      resetForm();
      await loadVouchers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan voucher.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVoucher(item: VoucherRow) {
    if (!user?.id) return;

    setSaving(true);

    try {
      const { error } = await db
        .from("vouchers")
        .update({
          is_active: !item.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("seller_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success(
        !item.is_active ? "Voucher diaktifkan." : "Voucher dinonaktifkan.",
      );

      await loadVouchers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah voucher.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteVoucher(item: VoucherRow) {
    if (!user?.id) return;

    const confirmed = window.confirm(
      `Hapus voucher ${item.code}? Voucher yang sudah dipakai pada order lama tetap tercatat.`,
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const { error } = await db
        .from("vouchers")
        .delete()
        .eq("id", item.id)
        .eq("seller_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Voucher berhasil dihapus.");
      await loadVouchers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus voucher.",
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
              <h1 className="text-3xl font-bold">Voucher / Kupon Diskon</h1>

              <p className="mt-1 text-muted-foreground">
                Buat kode voucher untuk pembeli dan kelola kuota pemakaiannya.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadVouchers}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>

              <Button asChild variant="outline">
                <a href="/dashboard/penjual">Dashboard Penjual</a>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
            <form
              onSubmit={handleSubmit}
              className="h-fit rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2">
                <TicketPercent className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  {editingId ? "Edit Voucher" : "Buat Voucher"}
                </h2>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="text-sm font-medium">Kode Voucher</label>
                  <Input
                    value={form.code}
                    onChange={(event) =>
                      updateForm("code", event.target.value.toUpperCase())
                    }
                    placeholder="CONTOH: REVIBE10"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nama Voucher</label>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Diskon Launching"
                    className="mt-2"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Tipe Diskon</label>
                    <select
                      value={form.discount_type}
                      onChange={(event) =>
                        updateForm(
                          "discount_type",
                          event.target.value as "fixed" | "percent",
                        )
                      }
                      className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="fixed">Nominal</option>
                      <option value="percent">Persen</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Nilai Diskon</label>
                    <Input
                      type="number"
                      value={form.discount_value}
                      onChange={(event) =>
                        updateForm("discount_value", event.target.value)
                      }
                      placeholder={form.discount_type === "percent" ? "10" : "10000"}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Minimal Belanja</label>
                    <Input
                      type="number"
                      value={form.min_order}
                      onChange={(event) =>
                        updateForm("min_order", event.target.value)
                      }
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Maksimal Diskon
                    </label>
                    <Input
                      type="number"
                      value={form.max_discount}
                      onChange={(event) =>
                        updateForm("max_discount", event.target.value)
                      }
                      placeholder="Opsional"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Kuota Pemakaian</label>
                  <Input
                    type="number"
                    value={form.usage_limit}
                    onChange={(event) =>
                      updateForm("usage_limit", event.target.value)
                    }
                    placeholder="Kosongkan jika unlimited"
                    className="mt-2"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Mulai</label>
                    <Input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(event) =>
                        updateForm("starts_at", event.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Berakhir</label>
                    <Input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(event) =>
                        updateForm("ends_at", event.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                  />
                  Voucher aktif
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
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? "Simpan Perubahan" : "Buat Voucher"}
                </Button>

                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal Edit
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Daftar Voucher</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Voucher aktif bisa digunakan buyer saat checkout.
                  </p>
                </div>

                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {items.length} voucher
                </div>
              </div>

              <div className="relative mt-5">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kode atau nama voucher..."
                  className="pl-9"
                />
              </div>

              <div className="mt-6">
                {loading ? (
                  <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-border">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <TicketPercent className="mx-auto h-10 w-10 text-primary" />
                    <div className="mt-4 font-semibold">Belum ada voucher</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Buat voucher pertama untuk toko kamu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map((item) => (
                      <VoucherCard
                        key={item.id}
                        item={item}
                        saving={saving}
                        onEdit={() => editVoucher(item)}
                        onToggle={() => toggleVoucher(item)}
                        onDelete={() => deleteVoucher(item)}
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

function VoucherCard({
  item,
  saving,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: VoucherRow;
  saving: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-3 py-1 font-mono font-bold text-primary">
              {item.code}
            </span>

            <span
              className={
                item.is_active
                  ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                  : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
              }
            >
              {item.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold">{item.name}</h3>

          <div className="mt-2 text-sm text-muted-foreground">
            {discountLabel(item)} · Min. belanja{" "}
            {formatIDR(Number(item.min_order ?? 0))}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Terpakai {Number(item.used_count ?? 0)}
            {item.usage_limit ? ` / ${item.usage_limit}` : " kali"}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Periode: {dateRangeLabel(item.starts_at, item.ends_at)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onEdit}>
            Edit
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onToggle}
          >
            {item.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>
    </article>
  );
}

function discountLabel(item: VoucherRow) {
  if (item.discount_type === "percent") {
    const maxDiscount =
      item.max_discount != null && Number(item.max_discount) > 0
        ? `, maks. ${formatIDR(Number(item.max_discount))}`
        : "";

    return `Diskon ${Number(item.discount_value)}%${maxDiscount}`;
  }

  return `Diskon ${formatIDR(Number(item.discount_value))}`;
}

function dateRangeLabel(start: string | null, end: string | null) {
  const startText = start ? new Date(start).toLocaleString("id-ID") : "Sekarang";
  const endText = end ? new Date(end).toLocaleString("id-ID") : "Tanpa batas";

  return `${startText} - ${endText}`;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}