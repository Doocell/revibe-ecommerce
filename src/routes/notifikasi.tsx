import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  formatNotificationDate,
  getSystemNotifications,
  markAllSystemNotificationsRead,
  markSystemNotificationRead,
  notificationTypeLabel,
  type SystemNotification,
} from "@/lib/system-notifications";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/notifikasi")({
  component: NotificationsPage,
});

const typeOptions = [
  { value: "", label: "Semua" },
  { value: "order", label: "Order" },
  { value: "payment", label: "Pembayaran" },
  { value: "shipping", label: "Pengiriman" },
  { value: "cancel", label: "Pembatalan" },
  { value: "product", label: "Produk" },
  { value: "chat", label: "Chat" },
  { value: "review", label: "Ulasan" },
  { value: "system", label: "Sistem" },
];

function NotificationsPage() {
  const { roles, loading: authLoading } = useAuth();

  const isAdmin = roles.includes("admin");

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  async function loadNotifications(next?: { search?: string; type?: string }) {
    setLoading(true);

    try {
      const rows = await getSystemNotifications({
        isAdmin,
        search: next?.search ?? search,
        type: next?.type ?? type,
        limit: 250,
      });

      setNotifications(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat notifikasi.",
      );

      console.error("[Load Notifications Error]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadNotifications({
        search: "",
        type: "",
      });
    }
  }, [authLoading, isAdmin]);

  function handleReset() {
    setSearch("");
    setType("");

    loadNotifications({
      search: "",
      type: "",
    });
  }

  async function handleMarkRead(notification: SystemNotification) {
    if (notification.is_read) return;

    setUpdatingId(notification.id);

    try {
      await markSystemNotificationRead({
        notificationId: notification.id,
        isAdmin,
      });

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );

      toast.success("Notifikasi ditandai sudah dibaca.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menandai notifikasi.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;

    setMarkingAll(true);

    try {
      await markAllSystemNotificationsRead({
        isAdmin,
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        })),
      );

      toast.success("Semua notifikasi ditandai sudah dibaca.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menandai semua notifikasi.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {isAdmin ? "Notifikasi Sistem" : "Notifikasi"}
              </h1>

              <p className="mt-1 text-muted-foreground">
                Pantau order, pengiriman, produk, ulasan, dan chat.
              </p>

              <p className="mt-3 text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} notifikasi belum dibaca`
                  : "Semua notifikasi sudah dibaca"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <Button asChild variant="outline">
                  <a href="/dashboard/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard Admin
                  </a>
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={() => loadNotifications()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleMarkAllRead}
                disabled={markingAll || unreadCount === 0}
              >
                {markingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="mr-2 h-4 w-4" />
                )}
                Tandai Semua Dibaca
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      loadNotifications();
                    }
                  }}
                  placeholder="Cari notifikasi..."
                  className="pl-9"
                />
              </div>

              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {typeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                onClick={() => loadNotifications()}
                disabled={loading}
              >
                Terapkan
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
            </div>

            <div className="mt-6">
              {authLoading || loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-primary" />

                  <h3 className="mt-4 text-lg font-semibold">
                    Belum ada notifikasi
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Notifikasi order, produk, pengiriman, ulasan, dan chat akan
                    muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      updating={updatingId === notification.id}
                      onMarkRead={() => handleMarkRead(notification)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function NotificationCard({
  notification,
  updating,
  onMarkRead,
}: {
  notification: SystemNotification;
  updating: boolean;
  onMarkRead: () => void;
}) {
  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      className={`rounded-2xl border p-4 transition ${notification.is_read
          ? "border-border bg-background"
          : "border-primary/40 bg-primary/5"
        }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${notification.is_read
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
              }`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{notification.title}</h2>

              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {notificationTypeLabel(notification.type)}
              </span>

              {!notification.is_read ? (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                  Baru
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {notification.message || "-"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{formatNotificationDate(notification.created_at)}</span>

              {notification.entity_id ? (
                <>
                  <span>•</span>
                  <span>ID: {notification.entity_id}</span>
                </>
              ) : null}
            </div>

            <div className="mt-3">
              <EntityLink notification={notification} />
            </div>
          </div>
        </div>

        {!notification.is_read ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={updating}
            onClick={onMarkRead}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Tandai Dibaca
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EntityLink({
  notification,
}: {
  notification: SystemNotification;
}) {
  if (notification.entity_type === "order") {
    return (
      <a
        href="/dashboard/admin/transaksi"
        className="text-sm font-medium text-primary hover:underline"
      >
        Buka Monitoring Transaksi →
      </a>
    );
  }

  if (notification.entity_type === "product" && notification.entity_id) {
    return (
      <a
        href={`/detail-produk?id=${notification.entity_id}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        Lihat Produk →
      </a>
    );
  }

  if (notification.entity_type === "chat") {
    return (
      <a
        href="/dashboard/admin/chat"
        className="text-sm font-medium text-primary hover:underline"
      >
        Buka Monitoring Chat →
      </a>
    );
  }

  return null;
}

function getNotificationIcon(type: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    order: ShoppingBag,
    payment: CheckCircle2,
    shipping: Truck,
    cancel: XCircle,
    product: Package,
    review: Bell,
    chat: MessageCircle,
    system: Bell,
  };

  return icons[type] ?? Bell;
}