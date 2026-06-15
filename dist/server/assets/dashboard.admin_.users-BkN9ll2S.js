import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { s as supabase, N as Navbar, B as Button, F as Footer } from "./Navbar-BfYtpR_3.js";
import { R as RoleGuard } from "./RoleGuard-BjCuNJYy.js";
import { I as Input } from "./input-BeOeKeqX.js";
import { Users, CheckCircle2, XCircle, ShoppingBag, Store, ShieldCheck, ArrowLeft, Loader2, RefreshCw, Search, AlertCircle, UserRound } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
const db = supabase;
async function getAdminUsers(filters = {}) {
  const { data, error } = await db.rpc("get_admin_users", {
    p_role: filters.role || null,
    p_search: filters.search || null,
    p_status: filters.status || null,
    p_limit: filters.limit ?? 200
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(normalizeAdminUser);
}
async function setAdminUserActiveStatus({
  userId,
  isActive
}) {
  const cleanUserId = String(userId ?? "").trim();
  if (!cleanUserId || cleanUserId === "undefined") {
    throw new Error("ID user tidak valid.");
  }
  const { data, error } = await db.rpc("set_admin_user_active_status", {
    p_user_id: cleanUserId,
    p_is_active: isActive
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
function normalizeAdminUser(row) {
  return {
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    full_name: String(row.full_name ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    avatar_url: String(row.avatar_url ?? ""),
    city: String(row.city ?? ""),
    is_active: Boolean(row.is_active),
    roles: Array.isArray(row.roles) ? row.roles.map(String) : [],
    total_orders: Number(row.total_orders ?? 0),
    total_products: Number(row.total_products ?? 0),
    created_at: String(row.created_at ?? ""),
    last_sign_in_at: row.last_sign_in_at ?? null
  };
}
function roleLabel(role) {
  const labels = {
    admin: "Admin",
    seller: "Seller",
    buyer: "Buyer"
  };
  return labels[role] ?? role;
}
function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}
const roleOptions = [{
  value: "",
  label: "Semua Role"
}, {
  value: "buyer",
  label: "Buyer"
}, {
  value: "seller",
  label: "Seller"
}, {
  value: "admin",
  label: "Admin"
}];
const statusOptions = [{
  value: "",
  label: "Semua Status"
}, {
  value: "active",
  label: "Aktif"
}, {
  value: "inactive",
  label: "Nonaktif"
}];
function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  async function loadUsers(nextFilters) {
    setLoading(true);
    const activeFilters = {
      search,
      role,
      status,
      ...nextFilters
    };
    try {
      const rows = await getAdminUsers({
        search: activeFilters.search,
        role: activeFilters.role,
        status: activeFilters.status,
        limit: 300
      });
      setUsers(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data user.");
      console.error("[Load Admin Users Error]", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadUsers({
      search: "",
      role: "",
      status: ""
    });
  }, []);
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.is_active).length;
    const inactive = users.filter((item) => !item.is_active).length;
    const buyers = users.filter((item) => item.roles.includes("buyer")).length;
    const sellers = users.filter((item) => item.roles.includes("seller")).length;
    const admins = users.filter((item) => item.roles.includes("admin")).length;
    return [{
      label: "Total User",
      value: total,
      icon: Users
    }, {
      label: "Aktif",
      value: active,
      icon: CheckCircle2
    }, {
      label: "Nonaktif",
      value: inactive,
      icon: XCircle
    }, {
      label: "Buyer",
      value: buyers,
      icon: ShoppingBag
    }, {
      label: "Seller",
      value: sellers,
      icon: Store
    }, {
      label: "Admin",
      value: admins,
      icon: ShieldCheck
    }];
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
      status: ""
    });
  }
  async function handleToggleStatus(user) {
    const targetStatus = !user.is_active;
    const confirmed = window.confirm(targetStatus ? `Aktifkan akun ${user.email || user.full_name || user.id}?` : `Nonaktifkan akun ${user.email || user.full_name || user.id}?`);
    if (!confirmed) return;
    setUpdatingId(user.id);
    try {
      await setAdminUserActiveStatus({
        userId: user.id,
        isActive: targetStatus
      });
      toast.success(targetStatus ? "User berhasil diaktifkan." : "User berhasil dinonaktifkan.");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status user.");
      console.error("[Toggle Admin User Status Error]", error);
    } finally {
      setUpdatingId(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Monitoring User" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Pantau akun buyer, seller, admin, status akun, transaksi user, dan jumlah produk seller." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs("a", { href: "/dashboard/admin", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Dashboard Admin"
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => loadUsers(), disabled: loading, children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6", children: stats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsx(stat.icon, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 text-2xl font-bold", children: stat.value }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: stat.label })
      ] }, stat.label)) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), onKeyDown: (event) => {
            if (event.key === "Enter") {
              handleApplyFilter();
            }
          }, placeholder: "Cari email, nama, WhatsApp, atau kota...", className: "pl-9" })
        ] }),
        /* @__PURE__ */ jsx("select", { value: role, onChange: (event) => setRole(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: roleOptions.map((item) => /* @__PURE__ */ jsx("option", { value: item.value, children: item.label }, item.value)) }),
        /* @__PURE__ */ jsx("select", { value: status, onChange: (event) => setStatus(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm", children: statusOptions.map((item) => /* @__PURE__ */ jsx("option", { value: item.value, children: item.label }, item.value)) }),
        /* @__PURE__ */ jsx(Button, { type: "button", onClick: handleApplyFilter, disabled: loading, children: "Terapkan" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleResetFilter, disabled: loading, children: "Reset" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border", children: /* @__PURE__ */ jsx(Loader2, { className: "h-7 w-7 animate-spin text-primary" }) }) : users.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "mx-auto h-10 w-10 text-primary" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: "User tidak ditemukan" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Coba ubah kata kunci, role, atau status akun." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: users.map((user) => /* @__PURE__ */ jsx(UserCard, { user, updating: updatingId === user.id, onToggleStatus: () => handleToggleStatus(user) }, user.id)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function UserCard({
  user,
  updating,
  onToggleStatus
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-primary/10 text-primary", children: user.avatar_url ? /* @__PURE__ */ jsx("img", { src: user.avatar_url, alt: user.full_name || user.email || "User", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center", children: /* @__PURE__ */ jsx(UserRound, { className: "h-7 w-7" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: user.full_name || "Nama belum diisi" }),
            /* @__PURE__ */ jsx(StatusBadge, { active: user.is_active })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 break-all text-sm text-muted-foreground", children: user.email || "Email tidak tersedia" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: user.roles.length > 0 ? user.roles.map((role) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: roleLabel(role) }, role)) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700", children: "Role belum ada" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 text-sm md:grid-cols-4 lg:min-w-[560px]", children: [
        /* @__PURE__ */ jsx(Info, { label: "WhatsApp", value: user.whatsapp || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Kota", value: user.city || "-" }),
        /* @__PURE__ */ jsx(Info, { label: "Order", value: String(user.total_orders) }),
        /* @__PURE__ */ jsx(Info, { label: "Produk", value: String(user.total_products) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: user.is_active ? "destructive" : "default", disabled: updating, onClick: onToggleStatus, children: [
        updating ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : user.is_active ? /* @__PURE__ */ jsx(XCircle, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
        user.is_active ? "Nonaktifkan" : "Aktifkan"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Info, { label: "User ID", value: user.id }),
      /* @__PURE__ */ jsx(Info, { label: "Tanggal Daftar", value: formatDateTime(user.created_at) }),
      /* @__PURE__ */ jsx(Info, { label: "Login Terakhir", value: formatDateTime(user.last_sign_in_at) })
    ] })
  ] });
}
function StatusBadge({
  active
}) {
  if (active) {
    return /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800", children: "Aktif" });
  }
  return /* @__PURE__ */ jsx("span", { className: "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800", children: "Nonaktif" });
}
function Info({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "break-words font-medium", children: value || "-" })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RoleGuard, { required: "admin", children: /* @__PURE__ */ jsx(AdminUsersPage, {}) });
export {
  SplitComponent as component
};
