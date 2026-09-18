import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/MarketingLayout";
import { LeaderboardCard } from "@/components/leaderboard/LeaderboardCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useLeaderboard, useMyVotes, useVote } from "@/hooks/useLeaderboard";
import { PUBLIC_SITE_ORIGIN } from "@/lib/site-url";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Link-in-Bio Leaderboard for Developers — LTReee" },
      {
        name: "description",
        content:
          "The link-in-bio leaderboard: top developer projects on LTReee, ranked by community upvotes. Sign in to vote for the builds you like best.",
      },
      { property: "og:title", content: "Link-in-Bio Leaderboard for Developers — LTReee" },
      {
        property: "og:description",
        content:
          "The link-in-bio leaderboard for developers: community-ranked projects on LTReee. Upvote the builds you love.",
      },
      {
        name: "keywords",
        content:
          "link-in-bio leaderboard, link in bio leaderboard, developer leaderboard, developer project ranking, project upvote, upvote projects, top developer projects, indie hacker projects, build in public showcase, developer project showcase, developer arena, project discovery, ranked projects, community voting, best side projects, developer portfolio ranking, link in bio for developers, ltreee leaderboard",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${PUBLIC_SITE_ORIGIN}/leaderboard` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${PUBLIC_SITE_ORIGIN}/leaderboard` }],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { session, isAuthenticated } = useSession();
  const leaderboard = useLeaderboard();
  const myVotes = useMyVotes(isAuthenticated);
  const vote = useVote();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const entries = leaderboard.data ?? [];
  const votes = myVotes.data ?? {};

  async function handleVote(projectId: string, value: -1 | 1) {
    if (!isAuthenticated) {
      toast("Sign in to vote", { description: "Voting is open to signed-in LTReee accounts." });
      return;
    }
    const current = votes[projectId] ?? 0;
    const next = current === value ? 0 : value;
    setPendingId(projectId);
    try {
      await vote.mutateAsync({ projectId, value: next });
      myVotes.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your vote");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <MarketingLayout>
      <header className="py-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          <Trophy className="size-3.5 text-primary" aria-hidden="true" />
          Link-in-bio leaderboard
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
          Link-in-bio leaderboard for developers
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          The link-in-bio leaderboard: projects from LTReee developers, ranked by upvotes minus
          downvotes. Add yours from your Arena and let the community decide.
        </p>
        {!isAuthenticated ? (
          <Button asChild size="sm" className="mt-5">
            <Link to="/auth" search={{ next: "/leaderboard" }}>
              Sign in to vote
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary" className="mt-5">
            <Link to="/arena">Add your project</Link>
          </Button>
        )}
      </header>

      <section aria-label="Ranked projects" className="space-y-3 pb-6">
        {leaderboard.isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          </div>
        ) : leaderboard.isError ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-14 text-center">
            <p className="font-medium">The leaderboard could not load</p>
            <Button className="mt-4" variant="secondary" onClick={() => void leaderboard.refetch()}>
              Try again
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-14 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 font-medium">No projects on the leaderboard yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Be the first. Open your Arena, switch a project on for the leaderboard, and publish
              your page.
            </p>
            <Button asChild className="mt-5">
              <Link to="/arena">Go to your Arena</Link>
            </Button>
          </div>
        ) : (
          entries.map((entry, index) => (
            <LeaderboardCard
              key={entry.id}
              entry={entry}
              rank={index + 1}
              myVote={votes[entry.id] ?? 0}
              isOwner={session?.user.id === entry.owner_user_id}
              pending={pendingId === entry.id}
              onVote={(value) => void handleVote(entry.id, value)}
            />
          ))
        )}
      </section>
    </MarketingLayout>
  );
}
