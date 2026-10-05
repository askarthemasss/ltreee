ALTER TABLE public.embed_views ADD COLUMN IF NOT EXISTS nonce text;
CREATE UNIQUE INDEX IF NOT EXISTS embed_views_nonce_key ON public.embed_views (nonce) WHERE nonce IS NOT NULL;
ALTER TABLE public.embed_clicks ADD COLUMN IF NOT EXISTS nonce text;
CREATE UNIQUE INDEX IF NOT EXISTS embed_clicks_nonce_link_key ON public.embed_clicks (nonce, link_id) WHERE nonce IS NOT NULL;