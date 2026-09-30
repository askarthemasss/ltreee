CREATE TABLE public.leaderboard_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.leaderboard_views TO service_role;

ALTER TABLE public.leaderboard_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX leaderboard_views_created_at_idx ON public.leaderboard_views (created_at DESC);