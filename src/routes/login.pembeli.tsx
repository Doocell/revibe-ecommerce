import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/login/pembeli")({
  component: () => (
    <AuthShell
      title="Masuk Pembeli"
      subtitle="Belanja barang preloved favoritmu."
      mode="login"
      role="buyer"
      switchHref="/register/pembeli"
      switchLabel="Belum punya akun pembeli? Daftar di sini"
    />
  ),
});
