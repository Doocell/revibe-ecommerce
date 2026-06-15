import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface Props {
  required: AppRole;
  children: React.ReactNode;
}

export function RoleGuard({ required, children }: Props) {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const loginPath = required === "admin" ? "/admin/login" : required === "seller" ? "/login/penjual" : "/login/pembeli";
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-brand">
            <h1 className="text-xl font-bold">Silakan masuk terlebih dahulu</h1>
            <p className="mt-2 text-sm text-muted-foreground">Anda perlu masuk untuk mengakses halaman ini.</p>
            <Button asChild className="mt-5 gradient-brand text-white">
              <Link to={loginPath}>Masuk</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!roles.includes(required)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <div className="max-w-md rounded-2xl border border-destructive/30 bg-card p-8 text-center">
            <h1 className="text-xl font-bold text-destructive">Akses ditolak</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Akses ditolak. Anda tidak memiliki izin untuk membuka halaman ini.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/">Kembali ke beranda</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
