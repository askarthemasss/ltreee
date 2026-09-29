REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, user_id, username, display_name, bio, avatar_url, location, website_url, is_published, show_email, show_phone, seo_title, seo_description, created_at, updated_at) ON public.profiles TO anon;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_contacts TO anon, authenticated;
GRANT SELECT ON public.links, public.projects, public.project_vote_totals TO anon;