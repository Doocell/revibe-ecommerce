import { Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole } from "@/lib/auth";

interface AuthShellProps {
  title: string;
  subtitle: string;
  mode: "login" | "register";
  role: AppRole;
  switchHref: string;
  switchLabel: string;
}

export function AuthShell(props: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 gradient-soft">
        <div className="container mx-auto grid min-h-[calc(100vh-12rem)] max-w-md items-center px-4 py-12">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-brand">
            <h1 className="text-2xl font-bold md:text-3xl">{props.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
            {props.mode === "login" ? (
              <LoginForm role={props.role} />
            ) : (
              <RegisterForm role={props.role} />
            )}
            <div className="mt-5 text-center text-sm text-muted-foreground">
              <Link to={props.switchHref} className="font-medium text-primary hover:underline">
                {props.switchLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LoginForm({ role }: { role: AppRole }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Verify role
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user!.id);
      const roles = (r ?? []).map((x) => x.role as AppRole);
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
      </div>
      <Button type="submit" className="w-full gradient-brand text-white shadow-brand" disabled={loading}>
        {loading ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}

function RegisterForm({ role }: { role: AppRole }) {
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "", shop_name: "", owner_name: "", email: "", whatsapp: "",
    shop_address: "", password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    if (form.password.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    setLoading(true);
    try {
      const meta: Record<string, string> = {
        role,
        whatsapp: form.whatsapp,
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
          data: meta,
        },
      });
      if (error) throw error;
      toast.success("Pendaftaran berhasil! Silakan masuk.");
      nav({ to: role === "seller" ? "/login/penjual" : "/login/pembeli" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {role === "buyer" ? (
        <Field label="Nama Lengkap" value={form.full_name} onChange={set("full_name")} required />
      ) : (
        <>
          <Field label="Nama Toko" value={form.shop_name} onChange={set("shop_name")} required />
          <Field label="Nama Pemilik" value={form.owner_name} onChange={set("owner_name")} required />
        </>
      )}
      <Field label="Email" type="email" value={form.email} onChange={set("email")} required />
      <Field label="Nomor WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} required placeholder="08xxxxxxxxxx" />
      {role === "seller" && (
        <Field label="Alamat Toko" value={form.shop_address} onChange={set("shop_address")} required />
      )}
      <Field label="Password" type="password" value={form.password} onChange={set("password")} required />
      <Field label="Konfirmasi Password" type="password" value={form.confirm} onChange={set("confirm")} required />
      <Button type="submit" className="w-full gradient-brand text-white shadow-brand" disabled={loading}>
        {loading ? "Memproses…" : "Daftar"}
      </Button>
    </form>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...props} className="mt-1" />
    </div>
  );
}
