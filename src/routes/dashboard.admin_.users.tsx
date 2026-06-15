import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatDateTime,
  getAdminUsers,
  roleLabel,
  setAdminUserActiveStatus,
  type AdminUserRow,
} from "@/lib/admin-users";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin_/users")({
  component: () => (
    <RoleGuard required="admin">
      <AdminUsersPage />
    </RoleGuard>
  ),
});

const roleOptions = [
  { value: "", label: "Semua Role" },
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

type FilterState = {
  search: string;
  role: string;
  status: string;
};

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  async function loadUsers(nextFilters?: Partial<FilterState>) {
    setLoading(true);

    const activeFilters = {
      search,
      role,
      status,
      ...nextFilters,
    };

    try {
      const rows = await getAdminUsers({
        search: activeFilters.search,
        role: activeFilters.role,
        status: activeFilters.status,
        limit: 300,
      });

      setUsers(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data user.",
      );

      console.error("[Load Admin Users Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers({
      search: "",
      role: "",
      status: "",
    });
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.is_active).length;
    const inactive = users.filter((item) => !item.is_active).length;
    const buyers = users.filter((item) => item.roles.includes("buyer")).length;
    const sellers = users.filter((item) => item.roles.includes("seller")).length;
    const admins = users.filter((item) => item.roles.includes("admin")).length;

    return [
      {
        label: "Total User",
        value: total,
        icon: Users,
      },
      {
        label: "Aktif",
        value: active,
        icon: CheckCircle2,
      },
      {
        label: "Nonaktif",
        value: inactive,
        icon: XCircle,
      },
      {
        label: "Buyer",
        value: buyers,
        icon: ShoppingBag,
      },
      {
        label: "Seller",
        value: sellers,
        icon: Store,
      },
      {
        label: "Admin",
        value: admins,
        icon: ShieldCheck,
      },
    ];
  }, [users]);

  function handleApplyFilter() {
    loadUsers();
  }

  function handleResetFilter() {
    setSearch("");
    setRole("");
    setStatus("");

    loadUsers({
      search: "",
      role: "",
      status: "",
    });
  }

  async function handleToggleStatus(user: AdminUserRow) {
    const targetStatus = !user.is_active;

    const confirmed = window.confirm(
      targetStatus
        ? `Aktifkan akun ${user.email || user.full_name || user.id}?`
        : `Nonaktifkan akun ${user.email || user.full_name || user.id}?`,
    );

    if (!confirmed) return;

    setUpdatingId(user.id);

    try {
      await setAdminUserActiveStatus({
        userId: user.id,
        isActive: targetStatus,
      });

      toast.success(
        targetStatus
          ? "User berhasil diaktifkan."
          : "User berhasil dinonaktifkan.",
      );

      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status user.",
      );

      console.error("[Toggle Admin User Status Error]", error);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Monitoring User</h1>

              <p className="mt-1 text-muted-foreground">
                Pantau akun buyer, seller, admin, status akun, transaksi user,
                dan jumlah produk seller.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard Admin
                </a>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => loadUsers()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <stat.icon className="h-5 w-5 text-primary" />

                <div className="mt-3 text-2xl font-bold">{stat.value}</div>

                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleApplyFilter();
                    }
                  }}
                  placeholder="Cari email, nama, WhatsApp, atau kota..."
                  className="pl-9"
                />
              </div>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {roleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                onClick={handleApplyFilter}
                disabled={loading}
              >
                Terapkan
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilter}
                disabled={loading}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-primary" />

                <h3 className="mt-4 text-lg font-semibold">
                  User tidak ditemukan
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Coba ubah kata kunci, role, atau status akun.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    updating={updatingId === user.id}
                    onToggleStatus={() => handleToggleStatus(user)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function UserCard({
  user,
  updating,
  onToggleStatus,
}: {
  user: AdminUserRow;
  updating: boolean;
  onToggleStatus: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-primary/10 text-primary">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound className="h-7 w-7" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                {user.full_name || "Nama belum diisi"}
              </h2>

              <StatusBadge active={user.is_active} />
            </div>

            <p className="mt-1 break-all text-sm text-muted-foreground">
              {user.email || "Email tidak tersedia"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    {roleLabel(role)}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  Role belum ada
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-4 lg:min-w-[560px]">
          <Info label="WhatsApp" value={user.whatsapp || "-"} />
          <Info label="Kota" value={user.city || "-"} />
          <Info label="Order" value={String(user.total_orders)} />
          <Info label="Produk" value={String(user.total_products)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={user.is_active ? "destructive" : "default"}
            disabled={updating}
            onClick={onToggleStatus}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : user.is_active ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}

            {user.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-3">
        <Info label="User ID" value={user.id} />
        <Info label="Tanggal Daftar" value={formatDateTime(user.created_at)} />
        <Info
          label="Login Terakhir"
          value={formatDateTime(user.last_sign_in_at)}
        />
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        Aktif
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
      Nonaktif
    </span>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value || "-"}</div>
    </div>
  );
}