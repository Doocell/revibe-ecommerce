import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { u as useAuth, N as Navbar, F as Footer, B as Button } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { T as Textarea } from "./textarea-DDCz9iDe.js";
import { g as getMyProfile, u as updateMyProfile } from "./profile-TICuBD3F.js";
import { Loader2, UserRound, Store, Save } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "@radix-ui/react-label";
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
function ProfilePage() {
  const {
    user,
    roles,
    loading: authLoading
  } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
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
        shop_logo_url: row.shop_logo_url ?? ""
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat profil.");
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
  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }
  async function handleSubmit(event) {
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
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan profil.");
      console.error("[Save Profile Error]", error);
    } finally {
      setSaving(false);
    }
  }
  if (authLoading || loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  if (!user) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Navbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx(UserRound, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold", children: "Profil Saya" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Silakan login terlebih dahulu untuk mengelola profil." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 gradient-brand text-white", children: /* @__PURE__ */ jsx("a", { href: "/login/pembeli", children: "Login" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Profil Saya" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Kelola identitas akun, kontak, alamat, dan informasi toko." })
        ] }),
        isSeller ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: `/toko/${user.id}`, children: [
          /* @__PURE__ */ jsx(Store, { className: "mr-2 h-4 w-4" }),
          "Lihat Toko Publik"
        ] }) }) : null
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted", children: form.avatar_url ? /* @__PURE__ */ jsx("img", { src: form.avatar_url, alt: form.full_name || "Avatar", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(UserRound, { className: "h-8 w-8" }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: form.full_name || "Nama belum diisi" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: user.email }),
                /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: safeRoles.map((role) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary", children: role }, role)) })
              ] })
            ] }),
            profile?.updated_at ? /* @__PURE__ */ jsxs("p", { className: "mt-4 text-xs text-muted-foreground", children: [
              "Terakhir diperbarui:",
              " ",
              new Date(profile.updated_at).toLocaleString("id-ID")
            ] }) : null
          ] }),
          isSeller ? /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted", children: form.shop_logo_url ? /* @__PURE__ */ jsx("img", { src: form.shop_logo_url, alt: form.shop_name || "Logo toko", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(Store, { className: "h-8 w-8" }) }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: form.shop_name || "Nama toko belum diisi" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: form.shop_location || "Lokasi toko belum diisi" })
            ] })
          ] }) }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informasi Akun" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nama Lengkap" }),
                /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (event) => updateField("full_name", event.target.value), placeholder: "Nama lengkap" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nomor WhatsApp" }),
                /* @__PURE__ */ jsx(Input, { value: form.whatsapp, onChange: (event) => updateField("whatsapp", event.target.value), placeholder: "08xxxxxxxxxx" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "URL Foto Profil" }),
                /* @__PURE__ */ jsx(Input, { value: form.avatar_url, onChange: (event) => updateField("avatar_url", event.target.value), placeholder: "https://..." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Kota" }),
                /* @__PURE__ */ jsx(Input, { value: form.city, onChange: (event) => updateField("city", event.target.value), placeholder: "Contoh: Bandung" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Alamat" }),
                /* @__PURE__ */ jsx(Textarea, { value: form.address, onChange: (event) => updateField("address", event.target.value), rows: 3, placeholder: "Alamat utama" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Bio" }),
                /* @__PURE__ */ jsx(Textarea, { value: form.bio, onChange: (event) => updateField("bio", event.target.value), rows: 4, placeholder: "Ceritakan sedikit tentang kamu" })
              ] })
            ] })
          ] }),
          isSeller ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Informasi Toko" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Nama Toko" }),
                /* @__PURE__ */ jsx(Input, { value: form.shop_name, onChange: (event) => updateField("shop_name", event.target.value), placeholder: "Contoh: ReVibe Store" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Lokasi Toko" }),
                /* @__PURE__ */ jsx(Input, { value: form.shop_location, onChange: (event) => updateField("shop_location", event.target.value), placeholder: "Contoh: Jakarta Selatan" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "URL Logo Toko" }),
                /* @__PURE__ */ jsx(Input, { value: form.shop_logo_url, onChange: (event) => updateField("shop_logo_url", event.target.value), placeholder: "https://..." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Deskripsi Toko" }),
                /* @__PURE__ */ jsx(Textarea, { value: form.shop_description, onChange: (event) => updateField("shop_description", event.target.value), rows: 4, placeholder: "Jelaskan toko dan jenis produk yang dijual" })
              ] })
            ] })
          ] }) : null,
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: saving, className: "gradient-brand text-white", children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
            "Simpan Profil"
          ] }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
export {
  ProfilePage as component
};
