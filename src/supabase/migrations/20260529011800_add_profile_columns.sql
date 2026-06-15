-- Add new profile columns for buyer/seller profile feature
-- Safe: uses IF NOT EXISTS so it won't fail if columns already exist

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
