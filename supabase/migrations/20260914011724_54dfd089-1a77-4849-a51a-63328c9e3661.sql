ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS on_leaderboard boolean NOT NULL DEFAULT false;

CREATE TABLE public.project_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, voter_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_votes TO authenticated;
GRANT ALL ON public.project_votes TO service_role;

ALTER TABLE public.project_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voters read their own votes" ON public.project_votes
  FOR SELECT TO authenticated USING (voter_id = auth.uid());

CREATE POLICY "Voters cast their own votes" ON public.project_votes
  FOR INSERT TO authenticated WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Voters change their own votes" ON public.project_votes
  FOR UPDATE TO authenticated USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Voters remove their own votes" ON public.project_votes
  FOR DELETE TO authenticated USING (voter_id = auth.uid());

CREATE INDEX project_votes_project_idx ON public.project_votes (project_id);

CREATE TRIGGER project_votes_updated_at BEFORE UPDATE ON public.project_votes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_vote_totals (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.project_vote_totals TO anon, authenticated;
GRANT ALL ON public.project_vote_totals TO service_role;

ALTER TABLE public.project_vote_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard totals are public" ON public.project_vote_totals
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.projects pr
      JOIN public.profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_vote_totals.project_id
        AND pr.is_visible = true
        AND pr.on_leaderboard = true
        AND p.is_published = true
    )
  );

CREATE OR REPLACE FUNCTION public.validate_project_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_eligible boolean;
BEGIN
  SELECT p.user_id, (pr.is_visible AND pr.on_leaderboard AND p.is_published)
    INTO v_owner, v_eligible
  FROM public.projects pr
  JOIN public.profiles p ON p.id = pr.profile_id
  WHERE pr.id = NEW.project_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  IF v_owner = NEW.voter_id THEN
    RAISE EXCEPTION 'You cannot vote on your own project';
  END IF;
  IF NOT v_eligible THEN
    RAISE EXCEPTION 'Project is not on the leaderboard';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_project_vote() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER project_votes_validate BEFORE INSERT OR UPDATE ON public.project_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_vote();

CREATE OR REPLACE FUNCTION public.refresh_project_vote_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project uuid;
BEGIN
  v_project := COALESCE(NEW.project_id, OLD.project_id);

  INSERT INTO public.project_vote_totals (project_id, upvotes, downvotes, score, updated_at)
  SELECT v_project,
         COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0),
         COALESCE(SUM(value), 0),
         now()
  FROM public.project_votes WHERE project_id = v_project
  ON CONFLICT (project_id) DO UPDATE
    SET upvotes = EXCLUDED.upvotes,
        downvotes = EXCLUDED.downvotes,
        score = EXCLUDED.score,
        updated_at = now();

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_project_vote_totals() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER project_votes_totals AFTER INSERT OR UPDATE OR DELETE ON public.project_votes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_project_vote_totals();