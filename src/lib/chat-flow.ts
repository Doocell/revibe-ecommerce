import { supabase } from "@/integrations/supabase/client";

export type ChatProduct = {
  id: string;
  title: string;
  images: string[] | null;
  price: number | string;
  seller_id: string;
  status: string;
};

export type ChatProfile = {
  id: string;
  full_name: string | null;
  shop_name: string | null;
  whatsapp: string | null;
};

export type ChatConversation = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  products: ChatProduct | null;
  counterpart: ChatProfile | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type RawConversation = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  products: ChatProduct | null;
};

export async function startConversationFromProduct(productId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);

  if (!user) {
    throw new Error("Silakan login sebagai pembeli terlebih dahulu.");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, title, images, price, seller_id, status")
    .eq("id", productId)
    .single();

  if (productError) throw new Error(productError.message);

  if (!product) {
    throw new Error("Produk tidak ditemukan.");
  }

  if (product.status !== "approved") {
    throw new Error("Produk belum tersedia untuk ditanyakan.");
  }

  if (product.seller_id === user.id) {
    throw new Error("Penjual tidak bisa membuka chat untuk produknya sendiri sebagai pembeli.");
  }

  const { data: existingConversation, error: existingError } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("product_id", product.id)
    .eq("buyer_id", user.id)
    .eq("seller_id", product.seller_id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existingConversation) {
    return existingConversation as ChatConversation;
  }

  const { data: conversation, error: insertError } = await supabase
    .from("chat_conversations")
    .insert({
      product_id: product.id,
      buyer_id: user.id,
      seller_id: product.seller_id,
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);

  return conversation as ChatConversation;
}

export async function getMyConversations(userId: string) {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select(
      `
      *,
      products(id, title, images, price, seller_id, status)
    `,
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const conversations = (data ?? []) as RawConversation[];

  const counterpartIds = Array.from(
    new Set(
      conversations.map((conversation) =>
        conversation.buyer_id === userId
          ? conversation.seller_id
          : conversation.buyer_id,
      ),
    ),
  );

  if (counterpartIds.length === 0) {
    return conversations.map((conversation) => ({
      ...conversation,
      counterpart: null,
    })) as ChatConversation[];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, shop_name, whatsapp")
    .in("id", counterpartIds);

  if (profileError) {
    console.error("[Chat Profile Error]", profileError);

    return conversations.map((conversation) => ({
      ...conversation,
      counterpart: null,
    })) as ChatConversation[];
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return conversations.map((conversation) => {
    const counterpartId =
      conversation.buyer_id === userId
        ? conversation.seller_id
        : conversation.buyer_id;

    return {
      ...conversation,
      counterpart: profileMap.get(counterpartId) ?? null,
    };
  }) as ChatConversation[];
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as ChatMessage[];
}

export async function sendChatMessage({
  conversationId,
  senderId,
  message,
}: {
  conversationId: string;
  senderId: string;
  message: string;
}) {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error("Pesan tidak boleh kosong.");
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message: cleanMessage,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: updateError } = await supabase
    .from("chat_conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (updateError) {
    console.error("[Update Conversation Time Error]", updateError);
  }

  return data as ChatMessage;
}

export async function markConversationRead({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const { error } = await supabase
    .from("chat_messages")
    .update({
      is_read: true,
    })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  if (error) {
    console.error("[Mark Chat Read Error]", error);
  }
}

export function getConversationTitle(
  conversation: ChatConversation,
  currentUserId: string,
) {
  const isSeller = conversation.seller_id === currentUserId;

  if (isSeller) {
    return conversation.counterpart?.full_name || "Pembeli ReVibe";
  }

  return (
    conversation.counterpart?.shop_name ||
    conversation.counterpart?.full_name ||
    "Penjual ReVibe"
  );
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp 0";

  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}