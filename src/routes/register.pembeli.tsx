import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/register/pembeli")({
  component: () => (
    <AuthShell
      title="Daftar Pembeli"
      subtitle="Mulai temukan harta karun preloved-mu."
      mode="register"
      role="buyer"
      switchHref="/login/pembeli"
      switchLabel="Sudah punya akun? Masuk di sini"
    />
  ),
});
