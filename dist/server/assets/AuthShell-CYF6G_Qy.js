import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link, useNavigate } from "@tanstack/react-router";
import { N as Navbar, F as Footer, B as Button, s as supabase } from "./Navbar-BfYtpR_3.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { L as Label } from "./label-C-XjeFUt.js";
import { useState } from "react";
import { toast } from "sonner";
function AuthShell(props) {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1 gradient-soft", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto grid min-h-[calc(100vh-12rem)] max-w-md items-center px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-7 shadow-brand", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold md:text-3xl", children: props.title }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: props.subtitle }),
      props.mode === "login" ? /* @__PURE__ */ jsx(LoginForm, { role: props.role }) : /* @__PURE__ */ jsx(RegisterForm, { role: props.role }),
      /* @__PURE__ */ jsx("div", { className: "mt-5 text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(Link, { to: props.switchHref, className: "font-medium text-primary hover:underline", children: props.switchLabel }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function LoginForm({ role }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const roles = (r ?? []).map((x) => x.role);
      if (role === "admin") {
        if (!roles.includes("admin")) {
          await supabase.auth.signOut();
          throw new Error("Akses ditolak. Anda tidak memiliki izin untuk membuka halaman ini.");
        }
        toast.success("Berhasil masuk sebagai admin");
        nav({ to: "/dashboard/admin" });
        return;
      }
      if (!roles.includes(role)) {
        await supabase.auth.signOut();
        throw new Error(`Akun ini bukan akun ${role === "buyer" ? "pembeli" : "penjual"}.`);
      }
      toast.success("Berhasil masuk");
      nav({ to: role === "seller" ? "/dashboard/penjual" : "/dashboard/pembeli" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
      /* @__PURE__ */ jsx(Input, { id: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "mt-1" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
      /* @__PURE__ */ jsx(Input, { id: "password", type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "mt-1" })
    ] }),
    /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full gradient-brand text-white shadow-brand", disabled: loading, children: loading ? "Memproses…" : "Masuk" })
  ] });
}
function RegisterForm({ role }) {
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    shop_name: "",
    owner_name: "",
    email: "",
    whatsapp: "",
    shop_address: "",
    password: "",
    confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const meta = {
        role,
        whatsapp: form.whatsapp
      };
      if (role === "buyer") meta.full_name = form.full_name;
      if (role === "seller") {
        meta.full_name = form.owner_name;
        meta.shop_name = form.shop_name;
        meta.shop_address = form.shop_address;
      }
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: meta
        }
      });
      if (error) throw error;
      toast.success("Pendaftaran berhasil! Silakan masuk.");
      nav({ to: role === "seller" ? "/login/penjual" : "/login/pembeli" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
    role === "buyer" ? /* @__PURE__ */ jsx(Field, { label: "Nama Lengkap", value: form.full_name, onChange: set("full_name"), required: true }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Field, { label: "Nama Toko", value: form.shop_name, onChange: set("shop_name"), required: true }),
      /* @__PURE__ */ jsx(Field, { label: "Nama Pemilik", value: form.owner_name, onChange: set("owner_name"), required: true })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Email", type: "email", value: form.email, onChange: set("email"), required: true }),
    /* @__PURE__ */ jsx(Field, { label: "Nomor WhatsApp", value: form.whatsapp, onChange: set("whatsapp"), required: true, placeholder: "08xxxxxxxxxx" }),
    role === "seller" && /* @__PURE__ */ jsx(Field, { label: "Alamat Toko", value: form.shop_address, onChange: set("shop_address"), required: true }),
    /* @__PURE__ */ jsx(Field, { label: "Password", type: "password", value: form.password, onChange: set("password"), required: true }),
    /* @__PURE__ */ jsx(Field, { label: "Konfirmasi Password", type: "password", value: form.confirm, onChange: set("confirm"), required: true }),
    /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full gradient-brand text-white shadow-brand", disabled: loading, children: loading ? "Memproses…" : "Daftar" })
  ] });
}
function Field({ label, ...props }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Label, { children: label }),
    /* @__PURE__ */ jsx(Input, { ...props, className: "mt-1" })
  ] });
}
export {
  AuthShell as A
};
