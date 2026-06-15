import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/register/penjual")({
  component: () => (
    <AuthShell
      title="Daftar Penjual"
      subtitle="Buka toko preloved-mu di ReVibe."
      mode="register"
      role="seller"
      switchHref="/login/penjual"
      switchLabel="Sudah punya akun? Masuk di sini"
    />
  ),
});
