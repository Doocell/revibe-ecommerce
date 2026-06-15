ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'chat_conversations'
    AND policyname = 'chat_conversations_select_participants_admin'
  ) THEN
    CREATE POLICY "chat_conversations_select_participants_admin"
    ON public.chat_conversations
    FOR SELECT
    USING (
      auth.uid() = buyer_id
      OR auth.uid() = seller_id
      OR public.has_role(auth.uid(), 'admin')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'chat_conversations'
    AND policyname = 'chat_conversations_insert_participants'
  ) THEN
    CREATE POLICY "chat_conversations_insert_participants"
    ON public.chat_conversations
    FOR INSERT
    WITH CHECK (
      auth.uid() = buyer_id
      OR auth.uid() = seller_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'chat_conversations'
    AND policyname = 'chat_conversations_update_participants_admin'
  ) THEN
    CREATE POLICY "chat_conversations_update_participants_admin"
    ON public.chat_conversations
    FOR UPDATE
    USING (
      auth.uid() = buyer_id
      OR auth.uid() = seller_id
      OR public.has_role(auth.uid(), 'admin')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'chat_messages'
    AND policyname = 'chat_messages_select_participants_admin'
  ) THEN
    CREATE POLICY "chat_messages_select_participants_admin"
    ON public.chat_messages
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.chat_conversations c
        WHERE c.id = conversation_id
        AND (
          auth.uid() = c.buyer_id
          OR auth.uid() = c.seller_id
          OR public.has_role(auth.uid(), 'admin')
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'chat_messages'
    AND policyname = 'chat_messages_insert_participants'
  ) THEN
    CREATE POLICY "chat_messages_insert_participants"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
      auth.uid() = sender_id
      AND EXISTS (
        SELECT 1
        FROM public.chat_conversations c
        WHERE c.id = conversation_id
        AND (
          auth.uid() = c.buyer_id
          OR auth.uid() = c.seller_id
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'chat_messages'
    AND policyname = 'chat_messages_update_participants_admin'
  ) THEN
    CREATE POLICY "chat_messages_update_participants_admin"
    ON public.chat_messages
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.chat_conversations c
        WHERE c.id = conversation_id
        AND (
          auth.uid() = c.buyer_id
          OR auth.uid() = c.seller_id
          OR public.has_role(auth.uid(), 'admin')
        )
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer_id
ON public.chat_conversations(buyer_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_seller_id
ON public.chat_conversations(seller_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at
ON public.chat_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id_created_at
ON public.chat_messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.get_admin_sellers(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS TABLE (
  seller_id UUID,
  email TEXT,
  full_name TEXT,
  shop_name TEXT,
  whatsapp TEXT,
  city TEXT,
  shop_location TEXT,
  is_active BOOLEAN,
  total_products BIGINT,
  active_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  inactive_products BIGINT,
  total_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT,
  gross_revenue NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat membaca data seller.';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS seller_id,
    COALESCE(au.email, '')::TEXT AS email,
    COALESCE(p.full_name, '')::TEXT AS full_name,
    COALESCE(p.shop_name, '')::TEXT AS shop_name,
    COALESCE(p.whatsapp, '')::TEXT AS whatsapp,
    COALESCE(p.city, '')::TEXT AS city,
    COALESCE(p.shop_location, p.shop_address, '')::TEXT AS shop_location,
    COALESCE(p.is_active, true)::BOOLEAN AS is_active,
    COALESCE(prod.total_products, 0)::BIGINT AS total_products,
    COALESCE(prod.active_products, 0)::BIGINT AS active_products,
    COALESCE(prod.pending_products, 0)::BIGINT AS pending_products,
    COALESCE(prod.rejected_products, 0)::BIGINT AS rejected_products,
    COALESCE(prod.inactive_products, 0)::BIGINT AS inactive_products,
    COALESCE(ord.total_orders, 0)::BIGINT AS total_orders,
    COALESCE(ord.completed_orders, 0)::BIGINT AS completed_orders,
    COALESCE(ord.cancelled_orders, 0)::BIGINT AS cancelled_orders,
    COALESCE(ord.gross_revenue, 0)::NUMERIC AS gross_revenue,
    COALESCE(p.created_at, au.created_at)::TIMESTAMPTZ AS created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur
    ON ur.user_id = p.id
    AND ur.role::TEXT = 'seller'
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS total_products,
      COUNT(*) FILTER (WHERE pr.status::TEXT = 'approved') AS active_products,
      COUNT(*) FILTER (WHERE pr.status::TEXT = 'pending') AS pending_products,
      COUNT(*) FILTER (WHERE pr.status::TEXT = 'rejected') AS rejected_products,
      COUNT(*) FILTER (WHERE pr.status::TEXT = 'inactive') AS inactive_products
    FROM public.products pr
    WHERE pr.seller_id = p.id
  ) prod ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS total_orders,
      COUNT(*) FILTER (WHERE o.order_status::TEXT IN ('selesai', 'pesanan_diterima')) AS completed_orders,
      COUNT(*) FILTER (WHERE o.order_status::TEXT = 'dibatalkan') AS cancelled_orders,
      COALESCE(
        SUM(o.total) FILTER (
          WHERE o.order_status::TEXT <> 'dibatalkan'
          AND o.payment_status::TEXT IN ('dibayar', 'pembayaran_berhasil')
        ),
        0
      ) AS gross_revenue
    FROM public.orders o
    WHERE o.seller_id = p.id
  ) ord ON true
  WHERE
    (
      p_status IS NULL
      OR p_status = ''
      OR (p_status = 'active' AND COALESCE(p.is_active, true) = true)
      OR (p_status = 'inactive' AND COALESCE(p.is_active, true) = false)
    )
    AND (
      p_search IS NULL
      OR p_search = ''
      OR LOWER(
        COALESCE(au.email, '') || ' ' ||
        COALESCE(p.full_name, '') || ' ' ||
        COALESCE(p.shop_name, '') || ' ' ||
        COALESCE(p.whatsapp, '') || ' ' ||
        COALESCE(p.city, '') || ' ' ||
        COALESCE(p.shop_location, '') || ' ' ||
        COALESCE(p.shop_address, '')
      ) LIKE '%' || LOWER(p_search) || '%'
    )
  ORDER BY COALESCE(ord.gross_revenue, 0) DESC, COALESCE(p.created_at, au.created_at) DESC
  LIMIT LEAST(COALESCE(p_limit, 300), 500);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_chat_threads(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS TABLE (
  conversation_id UUID,
  buyer_id UUID,
  seller_id UUID,
  buyer_name TEXT,
  seller_name TEXT,
  product_id UUID,
  product_title TEXT,
  product_image TEXT,
  last_message TEXT,
  last_sender_id UUID,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat membaca chat.';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.buyer_id,
    c.seller_id,
    COALESCE(bp.full_name, bau.email, 'Buyer')::TEXT AS buyer_name,
    COALESCE(sp.shop_name, sp.full_name, sau.email, 'Seller')::TEXT AS seller_name,
    c.product_id,
    COALESCE(pr.title, 'Produk')::TEXT AS product_title,
    CASE
      WHEN pr.images IS NOT NULL AND array_length(pr.images, 1) > 0
      THEN pr.images[1]
      ELSE NULL
    END::TEXT AS product_image,
    COALESCE(last_msg.message, '')::TEXT AS last_message,
    last_msg.sender_id AS last_sender_id,
    last_msg.created_at AS last_message_at,
    COALESCE(msg_count.message_count, 0)::BIGINT AS message_count,
    COALESCE(msg_count.unread_count, 0)::BIGINT AS unread_count
  FROM public.chat_conversations c
  LEFT JOIN public.profiles bp ON bp.id = c.buyer_id
  LEFT JOIN public.profiles sp ON sp.id = c.seller_id
  LEFT JOIN auth.users bau ON bau.id = c.buyer_id
  LEFT JOIN auth.users sau ON sau.id = c.seller_id
  LEFT JOIN public.products pr ON pr.id = c.product_id
  LEFT JOIN LATERAL (
    SELECT m.message, m.sender_id, m.created_at
    FROM public.chat_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) last_msg ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS message_count,
      COUNT(*) FILTER (WHERE m.is_read = false) AS unread_count
    FROM public.chat_messages m
    WHERE m.conversation_id = c.id
  ) msg_count ON true
  WHERE
    p_search IS NULL
    OR p_search = ''
    OR LOWER(
      COALESCE(bp.full_name, '') || ' ' ||
      COALESCE(bau.email, '') || ' ' ||
      COALESCE(sp.full_name, '') || ' ' ||
      COALESCE(sp.shop_name, '') || ' ' ||
      COALESCE(sau.email, '') || ' ' ||
      COALESCE(pr.title, '') || ' ' ||
      COALESCE(last_msg.message, '')
    ) LIKE '%' || LOWER(p_search) || '%'
  ORDER BY COALESCE(last_msg.created_at, c.updated_at, c.created_at) DESC
  LIMIT LEAST(COALESCE(p_limit, 300), 500);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_chat_messages(
  p_conversation_id UUID
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  sender_name TEXT,
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat membaca isi chat.';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    COALESCE(p.shop_name, p.full_name, au.email, 'User')::TEXT AS sender_name,
    m.message::TEXT,
    m.is_read,
    m.created_at
  FROM public.chat_messages m
  LEFT JOIN public.profiles p ON p.id = m.sender_id
  LEFT JOIN auth.users au ON au.id = m.sender_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_marketplace_report(
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat membaca laporan marketplace.';
  END IF;

  v_start := COALESCE(NULLIF(p_start_date, '')::DATE, (CURRENT_DATE - INTERVAL '30 days'))::TIMESTAMPTZ;
  v_end := (COALESCE(NULLIF(p_end_date, '')::DATE, CURRENT_DATE)::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 millisecond');

  SELECT jsonb_build_object(
    'summary',
    jsonb_build_object(
      'total_users', (SELECT COUNT(*) FROM public.profiles),
      'total_buyers', (
        SELECT COUNT(DISTINCT user_id)
        FROM public.user_roles
        WHERE role::TEXT = 'buyer'
      ),
      'total_sellers', (
        SELECT COUNT(DISTINCT user_id)
        FROM public.user_roles
        WHERE role::TEXT = 'seller'
      ),
      'total_products', (SELECT COUNT(*) FROM public.products),
      'approved_products', (
        SELECT COUNT(*)
        FROM public.products
        WHERE status::TEXT = 'approved'
      ),
      'pending_products', (
        SELECT COUNT(*)
        FROM public.products
        WHERE status::TEXT = 'pending'
      ),
      'total_orders', (
        SELECT COUNT(*)
        FROM public.orders
        WHERE created_at BETWEEN v_start AND v_end
      ),
      'completed_orders', (
        SELECT COUNT(*)
        FROM public.orders
        WHERE created_at BETWEEN v_start AND v_end
        AND order_status::TEXT IN ('selesai', 'pesanan_diterima')
      ),
      'cancelled_orders', (
        SELECT COUNT(*)
        FROM public.orders
        WHERE created_at BETWEEN v_start AND v_end
        AND order_status::TEXT = 'dibatalkan'
      ),
      'gross_revenue', (
        SELECT COALESCE(SUM(total), 0)
        FROM public.orders
        WHERE created_at BETWEEN v_start AND v_end
        AND order_status::TEXT <> 'dibatalkan'
        AND payment_status::TEXT IN ('dibayar', 'pembayaran_berhasil')
      ),
      'cancelled_value', (
        SELECT COALESCE(SUM(total), 0)
        FROM public.orders
        WHERE created_at BETWEEN v_start AND v_end
        AND order_status::TEXT = 'dibatalkan'
      )
    ),
    'top_products',
    COALESCE(
      (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT
            pr.id::TEXT AS product_id,
            pr.title AS product_title,
            CASE
              WHEN pr.images IS NOT NULL AND array_length(pr.images, 1) > 0
              THEN pr.images[1]
              ELSE NULL
            END AS product_image,
            SUM(oi.quantity)::BIGINT AS quantity_sold,
            SUM(oi.quantity * oi.price)::NUMERIC AS revenue
          FROM public.order_items oi
          JOIN public.orders o ON o.id = oi.order_id
          JOIN public.products pr ON pr.id = oi.product_id
          WHERE o.created_at BETWEEN v_start AND v_end
          AND o.order_status::TEXT <> 'dibatalkan'
          AND o.payment_status::TEXT IN ('dibayar', 'pembayaran_berhasil')
          GROUP BY pr.id, pr.title, pr.images
          ORDER BY SUM(oi.quantity) DESC, SUM(oi.quantity * oi.price) DESC
          LIMIT 10
        ) t
      ),
      '[]'::JSONB
    ),
    'top_sellers',
    COALESCE(
      (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT
            p.id::TEXT AS seller_id,
            COALESCE(p.shop_name, p.full_name, 'Seller') AS seller_name,
            COALESCE(au.email, '') AS email,
            COUNT(o.id)::BIGINT AS order_count,
            COALESCE(SUM(o.total), 0)::NUMERIC AS revenue
          FROM public.orders o
          JOIN public.profiles p ON p.id = o.seller_id
          LEFT JOIN auth.users au ON au.id = p.id
          WHERE o.created_at BETWEEN v_start AND v_end
          AND o.order_status::TEXT <> 'dibatalkan'
          AND o.payment_status::TEXT IN ('dibayar', 'pembayaran_berhasil')
          GROUP BY p.id, p.shop_name, p.full_name, au.email
          ORDER BY COALESCE(SUM(o.total), 0) DESC
          LIMIT 10
        ) t
      ),
      '[]'::JSONB
    ),
    'daily_sales',
    COALESCE(
      (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT
            DATE(o.created_at)::TEXT AS date,
            TO_CHAR(DATE(o.created_at), 'DD Mon YYYY') AS label,
            COUNT(o.id)::BIGINT AS orders,
            COALESCE(SUM(o.total), 0)::NUMERIC AS revenue
          FROM public.orders o
          WHERE o.created_at BETWEEN v_start AND v_end
          AND o.order_status::TEXT <> 'dibatalkan'
          AND o.payment_status::TEXT IN ('dibayar', 'pembayaran_berhasil')
          GROUP BY DATE(o.created_at)
          ORDER BY DATE(o.created_at) DESC
          LIMIT 31
        ) t
      ),
      '[]'::JSONB
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_sellers(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_chat_threads(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_chat_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_marketplace_report(TEXT, TEXT) TO authenticated;