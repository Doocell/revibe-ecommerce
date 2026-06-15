import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/admin/login")({
  component: () => (
    <AuthShell
      title="Masuk Admin"
      subtitle="Halaman ini hanya untuk administrator ReVibe."
      mode="login"
      role="admin"
      switchHref="/"
      switchLabel="Kembali ke beranda"
    />
  ),
});
