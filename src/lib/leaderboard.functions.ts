import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type LeaderboardEntry = {
  id: string;
  title: string;
  description: string;
  demo_url: string | null;
  repo_url: string | null;
  cover_path: string | null;
  tags: string[];
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  owner_user_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type Row = {
  id: string;
  title: string;
  description: string;
  demo_url: string | null;
  repo_url: string | null;
  cover_path: string | null;
  tags: string[];
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    user_id: string;
  } | null;
  project_vote_totals: { upvotes: number; downvotes: number; score: number } | null;
};

/** Public ranked list of projects opted into the LTReee leaderboard. */
export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardEntry[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, title, description, demo_url, repo_url, cover_path, tags, created_at, profiles!inner(username, display_name, avatar_url, user_id), project_vote_totals(upvotes, downvotes, score)",
      )
      .eq("is_visible", true)
      .eq("on_leaderboard", true)
      .eq("profiles.is_published", true)
      .limit(200);

    if (error || !data) return [];

    const rows = data as unknown as Row[];
    return rows
      .filter((r) => r.profiles)
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        demo_url: r.demo_url,
        repo_url: r.repo_url,
        cover_path: r.cover_path,
        tags: r.tags ?? [],
        created_at: r.created_at,
        username: r.profiles!.username,
        display_name: r.profiles!.display_name || r.profiles!.username,
        avatar_url: r.profiles!.avatar_url,
        owner_user_id: r.profiles!.user_id,
        upvotes: r.project_vote_totals?.upvotes ?? 0,
        downvotes: r.project_vote_totals?.downvotes ?? 0,
        score: r.project_vote_totals?.score ?? 0,
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.upvotes - a.upvotes ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },
);

/** The signed-in user's votes, keyed by project id. */
export const getMyVotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Record<string, number>> => {
    const { data } = await context.supabase
      .from("project_votes")
      .select("project_id, value")
      .eq("voter_id", context.userId);
    const map: Record<string, number> = {};
    for (const row of data ?? []) map[row.project_id] = row.value;
    return map;
  });

/** Cast, switch or remove a vote. `value` of 0 removes the existing vote. */
export const castVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { projectId: string; value: -1 | 0 | 1 }) => {
    const projectId = String(data.projectId ?? "");
    if (!projectId) throw new Error("Missing project");
    const value = Number(data.value);
    if (![-1, 0, 1].includes(value)) throw new Error("Invalid vote");
    return { projectId, value: value as -1 | 0 | 1 };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (data.value === 0) {
      const { error } = await context.supabase
        .from("project_votes")
        .delete()
        .eq("project_id", data.projectId)
        .eq("voter_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { error } = await context.supabase
      .from("project_votes")
      .upsert(
        { project_id: data.projectId, voter_id: context.userId, value: data.value },
        { onConflict: "project_id,voter_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
