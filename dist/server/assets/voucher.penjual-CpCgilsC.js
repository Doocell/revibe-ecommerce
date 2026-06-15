import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, TicketPercent, PlusCircle, Search, Trash2 } from "lucide-react";
import { u as useAuth, N as Navbar, B as Button, F as Footer, s as supabase } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
const emptyForm = {
  code: "",
  name: "",
  discount_type: "fixed",
  discount_value: "",
  min_order: "0",
  max_discount: "",
  usage_limit: "",
  starts_at: "",
  ends_at: "",
  is_active: true
};
function SellerVoucherPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
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
      const {
        data,
        error
      } = await db.from("vouchers").select("*").eq("seller_id", user.id).order("created_at", {
        ascending: false
      });
      if (error) {
        throw new Error(error.message);
      }
      setItems(data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat voucher.");
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
      return [item.code, item.name, item.discount_type, item.is_active ? "aktif" : "nonaktif"].join(" ").toLowerCase().includes(keyword);
    });
  }, [items, search]);
  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }
  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }
  function editVoucher(item) {
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
      is_active: Boolean(item.is_active)
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  async function handleSubmit(event) {
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
        max_discount: maxDiscount !== null && Number.isFinite(maxDiscount) ? maxDiscount : null,
        usage_limit: usageLimit !== null && Number.isFinite(usageLimit) ? Math.floor(usageLimit) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (editingId) {
        const {
          error
        } = await db.from("vouchers").update(payload).eq("id", editingId).eq("seller_id", user.id);
        if (error) {
          throw new Error(error.message);
        }
        toast.success("Voucher berhasil diperbarui.");
      } else {
        const {
          error
        } = await db.from("vouchers").insert({
          ...payload,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (error) {
          throw new Error(error.message);
        }
        toast.success("Voucher berhasil dibuat.");
      }
      resetForm();
      await loadVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan voucher.");
    } finally {
      setSaving(false);
    }
  }
  async function toggleVoucher(item) {
    if (!user?.id) return;
    setSaving(true);
    try {
      const {
        error
      } = await db.from("vouchers").update({
        is_active: !item.is_active,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", item.id).eq("seller_id", user.id);
      if (error) {
        throw new Error(error.message);
      }
      toast.success(!item.is_active ? "Voucher diaktifkan." : "Voucher dinonaktifkan.");
      await loadVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah voucher.");
    } finally {
      setSaving(false);
    }
  }
  async function deleteVoucher(item) {
    if (!user?.id) return;
    const confirmed = window.confirm(`Hapus voucher ${item.code}? Voucher yang sudah dipakai pada order lama tetap tercatat.`);
    if (!confirmed) return;
    setSaving(true);
    try {
      const {
        error
      } = await db.from("vouchers").delete().eq("id", item.id).eq("seller_id", user.id);
      if (error) {
        throw new Error(error.message);
      }
      toast.success("Voucher berhasil dihapus.");
      await loadVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus voucher.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Voucher / Kupon Diskon" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Buat kode voucher untuk pembeli dan kelola kuota pemakaiannya." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: loadVouchers, disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/penjual", children: "Dashboard Penjual" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[420px_1fr]", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "h-fit rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(TicketPercent, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: editingId ? "Edit Voucher" : "Buat Voucher" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Kode Voucher" }),
              /* @__PURE__ */ jsx(Input, { value: form.code, onChange: (event) => updateForm("code", event.target.value.toUpperCase()), placeholder: "CONTOH: REVIBE10", className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Nama Voucher" }),
              /* @__PURE__ */ jsx(Input, { value: form.name, onChange: (event) => updateForm("name", event.target.value), placeholder: "Diskon Launching", className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Tipe Diskon" }),
                /* @__PURE__ */ jsxs("select", { value: form.discount_type, onChange: (event) => updateForm("discount_type", event.target.value), className: "mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm", children: [
                  /* @__PURE__ */ jsx("option", { value: "fixed", children: "Nominal" }),
                  /* @__PURE__ */ jsx("option", { value: "percent", children: "Persen" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Nilai Diskon" }),
                /* @__PURE__ */ jsx(Input, { type: "number", value: form.discount_value, onChange: (event) => updateForm("discount_value", event.target.value), placeholder: form.discount_type === "percent" ? "10" : "10000", className: "mt-2" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Minimal Belanja" }),
                /* @__PURE__ */ jsx(Input, { type: "number", value: form.min_order, onChange: (event) => updateForm("min_order", event.target.value), placeholder: "0", className: "mt-2" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Maksimal Diskon" }),
                /* @__PURE__ */ jsx(Input, { type: "number", value: form.max_discount, onChange: (event) => updateForm("max_discount", event.target.value), placeholder: "Opsional", className: "mt-2" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Kuota Pemakaian" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: form.usage_limit, onChange: (event) => updateForm("usage_limit", event.target.value), placeholder: "Kosongkan jika unlimited", className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Mulai" }),
                /* @__PURE__ */ jsx(Input, { type: "datetime-local", value: form.starts_at, onChange: (event) => updateForm("starts_at", event.target.value), className: "mt-2" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Berakhir" }),
                /* @__PURE__ */ jsx(Input, { type: "datetime-local", value: form.ends_at, onChange: (event) => updateForm("ends_at", event.target.value), className: "mt-2" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.is_active, onChange: (event) => updateForm("is_active", event.target.checked) }),
              "Voucher aktif"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(PlusCircle, { className: "mr-2 h-4 w-4" }),
              editingId ? "Simpan Perubahan" : "Buat Voucher"
            ] }),
            editingId ? /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: "Batal Edit" }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Daftar Voucher" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Voucher aktif bisa digunakan buyer saat checkout." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [
              items.length,
              " voucher"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative mt-5", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Cari kode atau nama voucher...", className: "pl-9" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-60 items-center justify-center rounded-xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : filteredItems.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: [
            /* @__PURE__ */ jsx(TicketPercent, { className: "mx-auto h-10 w-10 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 font-semibold", children: "Belum ada voucher" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Buat voucher pertama untuk toko kamu." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filteredItems.map((item) => /* @__PURE__ */ jsx(VoucherCard, { item, saving, onEdit: () => editVoucher(item), onToggle: () => toggleVoucher(item), onDelete: () => deleteVoucher(item) }, item.id)) }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function VoucherCard({
  item,
  saving,
  onEdit,
  onToggle,
  onDelete
}) {
  return /* @__PURE__ */ jsx("article", { className: "rounded-2xl border border-border bg-background p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "rounded-lg bg-primary/10 px-3 py-1 font-mono font-bold text-primary", children: item.code }),
        /* @__PURE__ */ jsx("span", { className: item.is_active ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700" : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700", children: item.is_active ? "Aktif" : "Nonaktif" })
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 text-lg font-semibold", children: item.name }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [
        discountLabel(item),
        " · Min. belanja",
        " ",
        formatIDR(Number(item.min_order ?? 0))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Terpakai ",
        Number(item.used_count ?? 0),
        item.usage_limit ? ` / ${item.usage_limit}` : " kali"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Periode: ",
        dateRangeLabel(item.starts_at, item.ends_at)
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onEdit, children: "Edit" }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", disabled: saving, onClick: onToggle, children: item.is_active ? "Nonaktifkan" : "Aktifkan" }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", disabled: saving, onClick: onDelete, children: [
        /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
        "Hapus"
      ] })
    ] })
  ] }) });
}
function discountLabel(item) {
  if (item.discount_type === "percent") {
    const maxDiscount = item.max_discount != null && Number(item.max_discount) > 0 ? `, maks. ${formatIDR(Number(item.max_discount))}` : "";
    return `Diskon ${Number(item.discount_value)}%${maxDiscount}`;
  }
  return `Diskon ${formatIDR(Number(item.discount_value))}`;
}
function dateRangeLabel(start, end) {
  const startText = start ? new Date(start).toLocaleString("id-ID") : "Sekarang";
  const endText = end ? new Date(end).toLocaleString("id-ID") : "Tanpa batas";
  return `${startText} - ${endText}`;
}
function toDateTimeLocal(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1e3);
  return localDate.toISOString().slice(0, 16);
}
function formatIDR(value) {
  if (!Number.isFinite(value)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerVoucherPage, {}) });
export {
  SplitComponent as component
};
