import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, u as useAuth, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { Edit, Plus, Search, Loader2, Save, MapPin, CheckCircle2, Star, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@radix-ui/react-label";
const db = supabase;
async function getBuyerAddresses(buyerId) {
  const cleanBuyerId = String(buyerId ?? "").trim();
  if (!cleanBuyerId || cleanBuyerId === "undefined") {
    throw new Error("ID buyer tidak valid.");
  }
  const { data, error } = await db.from("buyer_addresses").select("*").eq("buyer_id", cleanBuyerId).order("is_default", { ascending: false }).order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
async function createBuyerAddress(payload) {
  validateAddressPayload(payload);
  if (payload.is_default) {
    await clearDefaultAddress(payload.buyer_id);
  }
  const { data, error } = await db.from("buyer_addresses").insert({
    buyer_id: payload.buyer_id,
    recipient_name: cleanRequired(payload.recipient_name),
    phone: cleanRequired(payload.phone),
    address: cleanRequired(payload.address),
    city: cleanText(payload.city),
    province: cleanText(payload.province),
    district: cleanText(payload.district),
    village: cleanText(payload.village),
    postal_code: cleanText(payload.postal_code),
    notes: cleanText(payload.notes),
    is_default: Boolean(payload.is_default)
  }).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function updateBuyerAddress({
  addressId,
  buyerId,
  payload
}) {
  const cleanAddressId = String(addressId ?? "").trim();
  const cleanBuyerId = String(buyerId ?? "").trim();
  if (!cleanAddressId || cleanAddressId === "undefined") {
    throw new Error("ID alamat tidak valid.");
  }
  if (!cleanBuyerId || cleanBuyerId === "undefined") {
    throw new Error("ID buyer tidak valid.");
  }
  if (payload.is_default) {
    await clearDefaultAddress(cleanBuyerId);
  }
  const updatePayload = removeUndefined({
    recipient_name: payload.recipient_name !== void 0 ? cleanRequired(payload.recipient_name) : void 0,
    phone: payload.phone !== void 0 ? cleanRequired(payload.phone) : void 0,
    address: payload.address !== void 0 ? cleanRequired(payload.address) : void 0,
    city: payload.city !== void 0 ? cleanText(payload.city) : void 0,
    province: payload.province !== void 0 ? cleanText(payload.province) : void 0,
    district: payload.district !== void 0 ? cleanText(payload.district) : void 0,
    village: payload.village !== void 0 ? cleanText(payload.village) : void 0,
    postal_code: payload.postal_code !== void 0 ? cleanText(payload.postal_code) : void 0,
    notes: payload.notes !== void 0 ? cleanText(payload.notes) : void 0,
    is_default: payload.is_default !== void 0 ? Boolean(payload.is_default) : void 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  const { data, error } = await db.from("buyer_addresses").update(updatePayload).eq("id", cleanAddressId).eq("buyer_id", cleanBuyerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function deleteBuyerAddress({
  addressId,
  buyerId
}) {
  const cleanAddressId = String(addressId ?? "").trim();
  const cleanBuyerId = String(buyerId ?? "").trim();
  if (!cleanAddressId || cleanAddressId === "undefined") {
    throw new Error("ID alamat tidak valid.");
  }
  if (!cleanBuyerId || cleanBuyerId === "undefined") {
    throw new Error("ID buyer tidak valid.");
  }
  const { error } = await db.from("buyer_addresses").delete().eq("id", cleanAddressId).eq("buyer_id", cleanBuyerId);
  if (error) {
    throw new Error(error.message);
  }
}
async function setDefaultBuyerAddress({
  addressId,
  buyerId
}) {
  const cleanAddressId = String(addressId ?? "").trim();
  const cleanBuyerId = String(buyerId ?? "").trim();
  if (!cleanAddressId || cleanAddressId === "undefined") {
    throw new Error("ID alamat tidak valid.");
  }
  if (!cleanBuyerId || cleanBuyerId === "undefined") {
    throw new Error("ID buyer tidak valid.");
  }
  await clearDefaultAddress(cleanBuyerId);
  const { data, error } = await db.from("buyer_addresses").update({
    is_default: true,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", cleanAddressId).eq("buyer_id", cleanBuyerId).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
async function clearDefaultAddress(buyerId) {
  const cleanBuyerId = String(buyerId ?? "").trim();
  if (!cleanBuyerId || cleanBuyerId === "undefined") {
    throw new Error("ID buyer tidak valid.");
  }
  const { error } = await db.from("buyer_addresses").update({
    is_default: false,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("buyer_id", cleanBuyerId).eq("is_default", true);
  if (error) {
    throw new Error(error.message);
  }
}
function validateAddressPayload(payload) {
  if (!cleanText(payload.buyer_id)) {
    throw new Error("ID buyer wajib ada.");
  }
  if (!cleanText(payload.recipient_name)) {
    throw new Error("Nama penerima wajib diisi.");
  }
  if (!cleanText(payload.phone)) {
    throw new Error("Nomor HP wajib diisi.");
  }
  if (!cleanText(payload.address)) {
    throw new Error("Alamat wajib diisi.");
  }
  if (!cleanText(payload.province)) {
    throw new Error("Provinsi wajib dipilih.");
  }
  if (!cleanText(payload.city)) {
    throw new Error("Kota/Kabupaten wajib dipilih.");
  }
  if (!cleanText(payload.district)) {
    throw new Error("Kecamatan wajib dipilih.");
  }
  if (!cleanText(payload.village)) {
    throw new Error("Kelurahan/Desa wajib dipilih.");
  }
  if (!cleanText(payload.postal_code)) {
    throw new Error("Kode pos wajib ada.");
  }
}
function cleanRequired(value) {
  const cleanValue = String(value ?? "").trim();
  if (!cleanValue) {
    throw new Error("Data wajib diisi.");
  }
  return cleanValue;
}
function cleanText(value) {
  const cleanValue = String(value ?? "").trim();
  return cleanValue.length > 0 ? cleanValue : null;
}
function removeUndefined(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== void 0)
  );
}
const emptyForm = {
  recipient_name: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  district: "",
  village: "",
  postal_code: "",
  notes: "",
  is_default: false
};
function AddressPage() {
  const {
    user
  } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [regionSearch, setRegionSearch] = useState("");
  const [regionResults, setRegionResults] = useState([]);
  const [searchingRegion, setSearchingRegion] = useState(false);
  const [regionTouched, setRegionTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
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
      toast.error(error instanceof Error ? error.message : "Gagal memuat alamat.");
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
        const response = await fetch(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(keyword)}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("Gagal mencari wilayah.");
        }
        const json = await response.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const mappedRows = rows.map((item) => ({
          code: item.code,
          village: String(item.village ?? "").trim(),
          district: String(item.district ?? "").trim(),
          regency: String(item.regency ?? "").trim(),
          province: String(item.province ?? "").trim()
        })).filter((item) => {
          return item.code && item.village && item.district && item.regency && item.province;
        }).slice(0, 30);
        setRegionResults(mappedRows);
      } catch (error) {
        if (error.name !== "AbortError") {
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
  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }
  function selectRegion(region) {
    setForm((current) => ({
      ...current,
      province: region.province,
      city: region.regency,
      district: region.district,
      village: region.village,
      postal_code: String(region.code)
    }));
    setRegionSearch(`${region.village}, ${region.district}, ${region.regency}, ${region.province} ${region.code}`);
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
      postal_code: ""
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
  function startEdit(address) {
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
      is_default: Boolean(address.is_default)
    });
    const regionLabel = [address.village, address.district, address.city, address.province, address.postal_code].filter(Boolean).join(", ");
    setRegionSearch(regionLabel);
    setRegionResults([]);
    setRegionTouched(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  async function handleSubmit(event) {
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
          payload: form
        });
        toast.success("Alamat berhasil diperbarui.");
      } else {
        await createBuyerAddress({
          buyer_id: user.id,
          ...form,
          is_default: form.is_default || addresses.length === 0
        });
        toast.success("Alamat berhasil ditambahkan.");
      }
      resetForm();
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan alamat.");
      console.error("[Save Buyer Address Error]", error);
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(addressId) {
    if (!user) return;
    const confirmed = window.confirm("Hapus alamat ini?");
    if (!confirmed) return;
    setUpdatingId(addressId);
    try {
      await deleteBuyerAddress({
        addressId,
        buyerId: user.id
      });
      toast.success("Alamat berhasil dihapus.");
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus alamat.");
      console.error("[Delete Buyer Address Error]", error);
    } finally {
      setUpdatingId(null);
    }
  }
  async function handleSetDefault(addressId) {
    if (!user) return;
    setUpdatingId(addressId);
    try {
      await setDefaultBuyerAddress({
        addressId,
        buyerId: user.id
      });
      toast.success("Alamat utama berhasil diperbarui.");
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengatur alamat utama.");
      console.error("[Set Default Address Error]", error);
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Alamat Pengiriman" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Simpan alamat pengiriman agar proses checkout lebih cepat." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx("a", { href: "/dashboard/pembeli", children: "Dashboard Pembeli" }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, className: "gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/checkout", children: "Ke Checkout" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            editingAddressId ? /* @__PURE__ */ jsx(Edit, { className: "h-5 w-5 text-primary" }) : /* @__PURE__ */ jsx(Plus, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: editingAddressId ? "Edit Alamat" : "Tambah Alamat" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Nama Penerima" }),
              /* @__PURE__ */ jsx(Input, { value: form.recipient_name, onChange: (event) => updateField("recipient_name", event.target.value), placeholder: "Nama penerima" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Nomor HP" }),
              /* @__PURE__ */ jsx(Input, { value: form.phone, onChange: (event) => updateField("phone", event.target.value), placeholder: "08xxxxxxxxxx" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Alamat Lengkap" }),
              /* @__PURE__ */ jsx(Textarea, { value: form.address, onChange: (event) => updateField("address", event.target.value), rows: 4, placeholder: "Nama jalan, nomor rumah, RT/RW, detail patokan" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Cari Kelurahan / Kecamatan / Kota" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx(Input, { value: regionSearch, onChange: (event) => {
                  setRegionTouched(true);
                  setRegionSearch(event.target.value);
                }, placeholder: "Contoh: Kebayoran Baru, Menteng, Bandung", className: "pl-9" }),
                regionSearch ? /* @__PURE__ */ jsx("button", { type: "button", onClick: clearRegion, className: "absolute right-3 top-2.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Reset" }) : null
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Ketik minimal 3 huruf, lalu pilih hasil yang sesuai agar kecamatan, kelurahan, dan kode pos terisi otomatis." }),
              searchingRegion ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-border p-4 text-sm text-muted-foreground", children: "Mencari wilayah..." }) : regionResults.length > 0 ? /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto rounded-xl border border-border bg-background p-2", children: regionResults.map((region, index) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => selectRegion(region), className: "block w-full rounded-lg px-3 py-3 text-left text-sm transition hover:bg-accent", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold", children: region.village }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
                  "Kec. ",
                  region.district,
                  ", ",
                  region.regency,
                  ",",
                  " ",
                  region.province
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs font-medium text-primary", children: [
                  "Kode Pos: ",
                  region.code
                ] })
              ] }, `${region.code}-${region.village}-${region.district}-${index}`)) }) : regionTouched && regionSearch.trim().length >= 3 ? /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground", children: "Wilayah tidak ditemukan. Coba gunakan kata kunci lain, misalnya nama kelurahan atau kecamatan." }) : null
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsx(ReadOnlyField, { label: "Provinsi", value: form.province }),
              /* @__PURE__ */ jsx(ReadOnlyField, { label: "Kota/Kabupaten", value: form.city }),
              /* @__PURE__ */ jsx(ReadOnlyField, { label: "Kecamatan", value: form.district }),
              /* @__PURE__ */ jsx(ReadOnlyField, { label: "Kelurahan/Desa", value: form.village })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Kode Pos" }),
              /* @__PURE__ */ jsx(Input, { value: form.postal_code, readOnly: true, placeholder: "Otomatis setelah kelurahan/desa dipilih", className: "bg-muted" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Catatan" }),
              /* @__PURE__ */ jsx(Textarea, { value: form.notes, onChange: (event) => updateField("notes", event.target.value), rows: 3, placeholder: "Contoh: rumah pagar hitam" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 rounded-xl border border-border p-3 text-sm", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.is_default, onChange: (event) => updateField("is_default", event.target.checked) }),
              "Jadikan alamat utama"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
              "Simpan Alamat"
            ] }),
            editingAddressId ? /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: "Batal Edit" }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Daftar Alamat" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Pilih satu alamat sebagai alamat utama." })
            ] }),
            /* @__PURE__ */ jsx(MapPin, { className: "h-6 w-6 text-primary" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-5", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : addresses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "mx-auto h-9 w-9 text-primary" }),
            /* @__PURE__ */ jsx("h3", { className: "mt-3 font-semibold", children: "Belum ada alamat tersimpan" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Tambahkan alamat agar checkout lebih cepat." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: addresses.map((address) => /* @__PURE__ */ jsx(AddressCard, { address, loading: updatingId === address.id, onEdit: () => startEdit(address), onDelete: () => handleDelete(address.id), onSetDefault: () => handleSetDefault(address.id) }, address.id)) }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function ReadOnlyField({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
    /* @__PURE__ */ jsx(Label, { children: label }),
    /* @__PURE__ */ jsx(Input, { value, readOnly: true, placeholder: "Otomatis", className: "bg-muted" })
  ] });
}
function AddressCard({
  address,
  loading,
  onEdit,
  onDelete,
  onSetDefault
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: address.recipient_name }),
          address.is_default ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
            "Utama"
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: address.phone })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        !address.is_default ? /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: loading, onClick: onSetDefault, children: [
          loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Star, { className: "mr-2 h-4 w-4" }),
          "Jadikan Utama"
        ] }) : null,
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: onEdit, children: [
          /* @__PURE__ */ jsx(Edit, { className: "mr-2 h-4 w-4" }),
          "Edit"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "destructive", size: "sm", disabled: loading, onClick: onDelete, children: [
          loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
          "Hapus"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg bg-accent p-3 text-sm", children: [
      /* @__PURE__ */ jsx("div", { children: address.address }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 text-muted-foreground", children: [address.village ? `Kel. ${address.village}` : "", address.district ? `Kec. ${address.district}` : "", address.city, address.province, address.postal_code].filter(Boolean).join(", ") || "-" }),
      address.notes ? /* @__PURE__ */ jsxs("div", { className: "mt-2 text-muted-foreground", children: [
        "Catatan: ",
        address.notes
      ] }) : null
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "buyer", children: /* @__PURE__ */ jsx(AddressPage, {}) });
export {
  SplitComponent as component
};
