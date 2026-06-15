import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/login/penjual")({
  component: () => (
    <AuthShell
      title="Masuk Penjual"
      subtitle="Kelola toko preloved-mu."
      mode="login"
      role="seller"
      switchHref="/register/penjual"
      switchLabel="Belum punya akun penjual? Daftar di sini"
    />
  ),
});
