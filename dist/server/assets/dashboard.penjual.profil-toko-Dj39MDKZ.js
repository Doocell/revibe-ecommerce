import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, F as Footer, B as Button } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { Loader2, ArrowLeft, Eye, Store, UserRound, Save } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@radix-ui/react-label";
const db = supabase;
async function getMySellerProfile() {
  const { data, error } = await db.rpc("get_my_seller_profile");
  if (error) {
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Profil seller tidak ditemukan. Pastikan akun sudah login sebagai penjual.");
  }
  return normalizeSellerProfile(row);
}
async function updateMySellerProfile(payload) {
  const { data, error } = await db.rpc("update_my_seller_profile", {
    p_full_name: cleanText(payload.full_name),
    p_whatsapp: cleanText(payload.whatsapp),
    p_avatar_url: cleanText(payload.avatar_url),
    p_address: cleanText(payload.address),
    p_city: cleanText(payload.city),
    p_bio: cleanText(payload.bio),
    p_shop_name: cleanText(payload.shop_name),
    p_shop_description: cleanText(payload.shop_description),
    p_shop_location: cleanText(payload.shop_location),
    p_shop_logo_url: cleanText(payload.shop_logo_url)
  });
  if (error) {
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Profil seller gagal diperbarui.");
  }
  return normalizeSellerProfile(row);
}
function normalizeSellerProfile(row) {
  return {
    id: String(row.id ?? ""),
    full_name: String(row.full_name ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    avatar_url: String(row.avatar_url ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    bio: String(row.bio ?? ""),
    shop_name: String(row.shop_name ?? ""),
    shop_description: String(row.shop_description ?? ""),
    shop_location: String(row.shop_location ?? ""),
    shop_logo_url: String(row.shop_logo_url ?? ""),
    updated_at: row.updated_at ?? null
  };
}
function cleanText(value) {
  return String(value ?? "").trim();
}
const emptyForm = {
  full_name: "",
  whatsapp: "",
  avatar_url: "",
  address: "",
  city: "",
  bio: "",
  shop_name: "",
  shop_description: "",
  shop_location: "",
  shop_logo_url: ""
};
function SellerShopProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
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
        shop_logo_url: row.shop_logo_url
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat profil toko.");
      console.error("[Load Seller Shop Profile Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadProfile();
  }, []);
  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }
  async function handleSubmit(event) {
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
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan profil toko.");
      console.error("[Save Seller Shop Profile Error]", error);
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Profil Toko" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Edit informasi toko penjual yang akan dilihat oleh pembeli." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/penjual", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Penjual"
          ] }) }),
          profile?.id ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/toko/${profile.id}`, children: [
            /* @__PURE__ */ jsx(Eye, { className: "mr-2 h-4 w-4" }),
            "Lihat Toko Publik"
          ] }) }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-muted", children: form.shop_logo_url ? /* @__PURE__ */ jsx("img", { src: form.shop_logo_url, alt: form.shop_name || "Logo toko", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(Store, { className: "h-10 w-10" }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: form.shop_name || "Nama toko belum diisi" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: form.shop_location || "Lokasi toko belum diisi" }),
                profile?.updated_at ? /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs text-muted-foreground", children: [
                  "Terakhir diperbarui:",
                  " ",
                  new Date(profile.updated_at).toLocaleString("id-ID")
                ] }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl bg-accent p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Preview Deskripsi" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground", children: form.shop_description || "Deskripsi toko belum diisi. Tulis penjelasan singkat tentang toko kamu." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted", children: form.avatar_url ? /* @__PURE__ */ jsx("img", { src: form.avatar_url, alt: form.full_name || "Foto seller", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(UserRound, { className: "h-7 w-7" }) }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: form.full_name || "Nama seller belum diisi" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: form.whatsapp || "Nomor WhatsApp belum diisi" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informasi Toko" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nama Toko" }),
                /* @__PURE__ */ jsx(Input, { value: form.shop_name, onChange: (event) => updateField("shop_name", event.target.value), placeholder: "Contoh: ReVibe Store" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Lokasi Toko" }),
                /* @__PURE__ */ jsx(Input, { value: form.shop_location, onChange: (event) => updateField("shop_location", event.target.value), placeholder: "Contoh: Bandung" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "URL Logo Toko" }),
                /* @__PURE__ */ jsx(Input, { value: form.shop_logo_url, onChange: (event) => updateField("shop_logo_url", event.target.value), placeholder: "https://..." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Deskripsi Toko" }),
                /* @__PURE__ */ jsx(Textarea, { value: form.shop_description, onChange: (event) => updateField("shop_description", event.target.value), rows: 5, placeholder: "Jelaskan jenis produk, keunggulan toko, dan informasi penting untuk pembeli." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informasi Seller" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nama Lengkap" }),
                /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (event) => updateField("full_name", event.target.value), placeholder: "Nama lengkap seller" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nomor WhatsApp" }),
                /* @__PURE__ */ jsx(Input, { value: form.whatsapp, onChange: (event) => updateField("whatsapp", event.target.value), placeholder: "08xxxxxxxxxx" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Kota Seller" }),
                /* @__PURE__ */ jsx(Input, { value: form.city, onChange: (event) => updateField("city", event.target.value), placeholder: "Contoh: Bandung" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "URL Foto Seller" }),
                /* @__PURE__ */ jsx(Input, { value: form.avatar_url, onChange: (event) => updateField("avatar_url", event.target.value), placeholder: "https://..." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Alamat Seller" }),
                /* @__PURE__ */ jsx(Textarea, { value: form.address, onChange: (event) => updateField("address", event.target.value), rows: 3, placeholder: "Alamat seller atau lokasi operasional toko" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Bio Seller" }),
                /* @__PURE__ */ jsx(Textarea, { value: form.bio, onChange: (event) => updateField("bio", event.target.value), rows: 4, placeholder: "Ceritakan sedikit tentang seller atau toko" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
            "Simpan Profil Toko"
          ] }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "seller", children: /* @__PURE__ */ jsx(SellerShopProfilePage, {}) });
export {
  SplitComponent as component
};
