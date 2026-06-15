import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  formatIDR,
  getConversationMessages,
  getConversationTitle,
  getMyConversations,
  markConversationRead,
  sendChatMessage,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/chat-flow";
import {
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShoppingBag,
} from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const [conversationLoading, setConversationLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const activeConversation = useMemo(() => {
    return (
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null
    );
  }, [conversations, activeConversationId]);

  async function loadConversations() {
    if (!user) {
      setConversationLoading(false);
      return;
    }

    setConversationLoading(true);

    try {
      const rows = await getMyConversations(user.id);
      setConversations(rows);

      const queryConversationId = new URLSearchParams(
        window.location.search,
      ).get("conversation");

      if (
        queryConversationId &&
        rows.some((conversation) => conversation.id === queryConversationId)
      ) {
        setActiveConversationId(queryConversationId);
      } else if (!activeConversationId && rows.length > 0) {
        setActiveConversationId(rows[0].id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat percakapan.",
      );
      console.error("[Load Conversations Error]", error);
    } finally {
      setConversationLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    if (!user || !conversationId) return;

    setMessageLoading(true);

    try {
      const rows = await getConversationMessages(conversationId);
      setMessages(rows);

      await markConversationRead({
        conversationId,
        userId: user.id,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat pesan.",
      );
      console.error("[Load Messages Error]", error);
    } finally {
      setMessageLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadConversations();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;

    const interval = window.setInterval(() => {
      loadMessages(activeConversationId);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activeConversationId, user]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }

    if (!activeConversationId) {
      toast.error("Pilih percakapan terlebih dahulu.");
      return;
    }

    if (!messageInput.trim()) {
      toast.error("Pesan tidak boleh kosong.");
      return;
    }

    setSending(true);

    try {
      const sentMessage = await sendChatMessage({
        conversationId: activeConversationId,
        senderId: user.id,
        message: messageInput,
      });

      setMessages((current) => [...current, sentMessage]);
      setMessageInput("");
      await loadConversations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengirim pesan.",
      );
      console.error("[Send Message Error]", error);
    } finally {
      setSending(false);
    }
  }

  if (authLoading || conversationLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 text-2xl font-bold">Chat ReVibe</h1>
              <p className="mt-2 text-muted-foreground">
                Silakan login terlebih dahulu untuk membuka percakapan.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild className="gradient-brand text-white">
                  <a href="/login/pembeli">Login Pembeli</a>
                </Button>

                <Button asChild variant="outline">
                  <a href="/login/penjual">Login Penjual</a>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Chat</h1>
              <p className="mt-1 text-muted-foreground">
                Pembeli bisa menanyakan detail barang, sedangkan penjual bisa
                membalas pertanyaan pembeli dari halaman ini.
              </p>
            </div>

            <Button variant="outline" onClick={loadConversations}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-8 grid min-h-[620px] gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">Percakapan</h2>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-3">
                {conversations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Belum ada percakapan. Pembeli harus membuka detail produk
                    lalu klik Chat Penjual terlebih dahulu.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setActiveConversationId(conversation.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          activeConversationId === conversation.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {conversation.products?.images?.[0] ? (
                              <img
                                src={conversation.products.images[0]}
                                alt={conversation.products.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                No Image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 font-semibold">
                              {getConversationTitle(conversation, user.id)}
                            </div>

                            <div className="line-clamp-1 text-sm text-muted-foreground">
                              {conversation.products?.title ?? "Produk"}
                            </div>

                            <div className="mt-1 text-xs font-medium text-primary">
                              {conversation.products
                                ? formatIDR(Number(conversation.products.price))
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-h-[620px] flex-col rounded-2xl border border-border bg-card">
              {!activeConversation ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center">
                  <div>
                    <MessageCircle className="mx-auto h-10 w-10 text-primary" />
                    <h2 className="mt-4 text-xl font-semibold">
                      Pilih percakapan
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Pilih percakapan di sisi kiri untuk mulai membalas chat.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShoppingBag className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold">
                          {getConversationTitle(activeConversation, user.id)}
                        </div>
                        <a
                          href={`/detail-produk?id=${activeConversation.product_id}`}
                          className="line-clamp-1 text-sm text-primary hover:underline"
                        >
                          {activeConversation.products?.title ?? "Lihat produk"}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messageLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        Belum ada pesan. Mulai percakapan dari kolom pesan di bawah.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.sender_id === user.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                isMine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-accent text-foreground"
                              }`}
                            >
                              <div className="whitespace-pre-line">
                                {message.message}
                              </div>

                              <div
                                className={`mt-1 text-[10px] ${
                                  isMine
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {new Date(message.created_at).toLocaleString(
                                  "id-ID",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "short",
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={handleSendMessage}
                    className="border-t border-border p-4"
                  >
                    <div className="flex gap-3">
                      <Textarea
                        value={messageInput}
                        onChange={(event) =>
                          setMessageInput(event.target.value)
                        }
                        placeholder="Tulis pesan balasan..."
                        rows={2}
                      />

                      <Button
                        type="submit"
                        disabled={sending}
                        className="self-end gradient-brand text-white"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
