ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_seo_title_len CHECK (seo_title IS NULL OR char_length(seo_title) <= 70),
  ADD CONSTRAINT profiles_seo_description_len CHECK (seo_description IS NULL OR char_length(seo_description) <= 170);

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT p.id, p.user_id, p.username, p.display_name, p.bio, p.avatar_url, p.location,
  p.website_url, p.is_published, c.email, c.phone, p.seo_title, p.seo_description
FROM public.profiles p
LEFT JOIN public.public_contacts c ON c.profile_id = p.id
WHERE p.is_published = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT ALL ON public.public_profiles TO service_role;