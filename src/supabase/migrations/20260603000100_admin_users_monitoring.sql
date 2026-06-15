ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.get_admin_users(
  p_role TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  city TEXT,
  is_active BOOLEAN,
  roles TEXT[],
  total_orders BIGINT,
  total_products BIGINT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat membaca data user.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(au.email, '')::TEXT AS email,
    COALESCE(p.full_name, '')::TEXT AS full_name,
    COALESCE(p.whatsapp, '')::TEXT AS whatsapp,
    COALESCE(p.avatar_url, '')::TEXT AS avatar_url,
    COALESCE(p.city, '')::TEXT AS city,
    COALESCE(p.is_active, true)::BOOLEAN AS is_active,
    COALESCE(
      ARRAY(
        SELECT ur.role::TEXT
        FROM public.user_roles ur
        WHERE ur.user_id = p.id
        ORDER BY ur.role::TEXT
      ),
      ARRAY[]::TEXT[]
    ) AS roles,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM public.orders o
        WHERE o.buyer_id = p.id OR o.seller_id = p.id
      ),
      0
    )::BIGINT AS total_orders,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM public.products pr
        WHERE pr.seller_id = p.id
      ),
      0
    )::BIGINT AS total_products,
    COALESCE(p.created_at, au.created_at)::TIMESTAMPTZ AS created_at,
    au.last_sign_in_at::TIMESTAMPTZ AS last_sign_in_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE
    (
      p_role IS NULL
      OR p_role = ''
      OR EXISTS (
        SELECT 1
        FROM public.user_roles ur_role
        WHERE ur_role.user_id = p.id
        AND ur_role.role::TEXT = p_role
      )
    )
    AND (
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
        COALESCE(p.whatsapp, '') || ' ' ||
        COALESCE(p.city, '')
      ) LIKE '%' || LOWER(p_search) || '%'
    )
  ORDER BY COALESCE(p.created_at, au.created_at) DESC
  LIMIT LEAST(COALESCE(p_limit, 300), 500);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_user_active_status(
  p_user_id UUID,
  p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat mengubah status user.';
  END IF;

  UPDATE public.profiles
  SET is_active = p_is_active
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User tidak ditemukan.';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users(TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_user_active_status(UUID, BOOLEAN) TO authenticated;