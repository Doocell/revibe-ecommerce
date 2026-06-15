import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatDateTime,
  getAdminChatMessages,
  getAdminChatThreads,
  type AdminChatMessage,
  type AdminChatThread,
} from "@/lib/admin-chat";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin_/chat")({
  component: () => (
    <RoleGuard required="admin">
      <AdminChatPage />
    </RoleGuard>
  ),
});

function AdminChatPage() {
  const [threads, setThreads] = useState<AdminChatThread[]>([]);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("");

  const [search, setSearch] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeThread = useMemo(() => {
    return (
      threads.find((thread) => thread.conversation_id === activeThreadId) ??
      null
    );
  }, [threads, activeThreadId]);

  async function loadThreads(nextSearch?: string) {
    setLoadingThreads(true);

    try {
      const rows = await getAdminChatThreads({
        search: nextSearch ?? search,
        limit: 300,
      });

      setThreads(rows);

      if (!activeThreadId && rows.length > 0) {
        setActiveThreadId(rows[0].conversation_id);
      }

      if (
        activeThreadId &&
        !rows.some((thread) => thread.conversation_id === activeThreadId)
      ) {
        setActiveThreadId(rows[0]?.conversation_id ?? "");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat percakapan.",
      );
      console.error("[Load Admin Chat Threads Error]", error);
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadMessages(conversationId: string) {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    try {
      const rows = await getAdminChatMessages(conversationId);
      setMessages(rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat isi chat.",
      );
      console.error("[Load Admin Chat Messages Error]", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadThreads("");
  }, []);

  useEffect(() => {
    loadMessages(activeThreadId);
  }, [activeThreadId]);

  function handleReset() {
    setSearch("");
    loadThreads("");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Monitoring Chat</h1>
              <p className="mt-1 text-muted-foreground">
                Pantau percakapan buyer dan seller untuk kebutuhan moderasi,
                komplain, dan audit marketplace.
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
                onClick={() => loadThreads()}
                disabled={loadingThreads}
              >
                {loadingThreads ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadThreads();
                  }}
                  placeholder="Cari buyer, seller, produk, atau isi pesan..."
                  className="pl-9"
                />
              </div>

              <Button type="button" onClick={() => loadThreads()}>
                Terapkan
              </Button>

              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-8 grid min-h-[640px] gap-6 lg:grid-cols-[380px_1fr]">
            <aside className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">Daftar Percakapan</h2>
                <p className="text-sm text-muted-foreground">
                  {threads.length} percakapan ditemukan
                </p>
              </div>

              <div className="max-h-[580px] overflow-y-auto p-3">
                {loadingThreads ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Belum ada percakapan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {threads.map((thread) => (
                      <button
                        key={thread.conversation_id}
                        type="button"
                        onClick={() =>
                          setActiveThreadId(thread.conversation_id)
                        }
                        className={`w-full rounded-xl border p-3 text-left transition ${activeThreadId === thread.conversation_id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                          }`}
                      >
                        <div className="flex gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                            {thread.product_image ? (
                              <img
                                src={thread.product_image}
                                alt={thread.product_title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-primary">
                                <MessageCircle className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 font-medium">
                              {thread.product_title}
                            </div>

                            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {thread.buyer_name} ↔ {thread.seller_name}
                            </div>

                            <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {thread.last_message || "Belum ada pesan."}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDateTime(thread.last_message_at)}</span>
                              <span>•</span>
                              <span>{thread.message_count} pesan</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="rounded-2xl border border-border bg-card">
              {activeThread ? (
                <>
                  <div className="border-b border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">
                          {activeThread.product_title}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Buyer: {activeThread.buyer_name} • Seller:{" "}
                          {activeThread.seller_name}
                        </p>
                      </div>

                      {activeThread.product_id ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/detail-produk?id=${activeThread.product_id}`}>
                            Lihat Produk
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="max-h-[580px] overflow-y-auto p-5">
                    {loadingMessages ? (
                      <div className="flex min-h-64 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        Belum ada pesan pada percakapan ini.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-2xl border border-border bg-background p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserRound className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-medium">
                                    {message.sender_name}
                                  </div>

                                  <div className="text-xs text-muted-foreground">
                                    {formatDateTime(message.created_at)}
                                  </div>
                                </div>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                                  {message.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[640px] items-center justify-center p-8 text-center">
                  <div>
                    <MessageCircle className="mx-auto h-10 w-10 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">
                      Pilih percakapan
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Admin dapat membaca riwayat chat buyer dan seller di sini.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}