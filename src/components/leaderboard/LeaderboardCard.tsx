import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { coverSrc } from "@/lib/project-cover";
import type { LeaderboardEntry } from "@/lib/leaderboard.functions";

type Props = {
  entry: LeaderboardEntry;
  rank: number;
  myVote: number;
  isOwner: boolean;
  pending: boolean;
  onVote: (value: -1 | 1) => void;
};

export function LeaderboardCard({ entry, rank, myVote, isOwner, pending, onVote }: Props) {
  const cover = coverSrc(entry.cover_path);

  return (
    <article className="flex gap-4 rounded-2xl glass p-4 sm:p-5">
      <div className="flex w-12 shrink-0 flex-col items-center gap-1">
        <Button
          size="icon"
          variant={myVote === 1 ? "default" : "ghost"}
          aria-label={myVote === 1 ? `Remove your upvote from ${entry.title}` : `Upvote ${entry.title}`}
          aria-pressed={myVote === 1}
          disabled={isOwner || pending}
          onClick={() => onVote(1)}
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-base font-semibold tabular-nums" aria-label={`Score ${entry.score}`}>
          {entry.score}
        </span>
        <Button
          size="icon"
          variant={myVote === -1 ? "default" : "ghost"}
          aria-label={
            myVote === -1 ? `Remove your downvote from ${entry.title}` : `Downvote ${entry.title}`
          }
          aria-pressed={myVote === -1}
          disabled={isOwner || pending}
          onClick={() => onVote(-1)}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">#{rank}</p>
            <h3 className="mt-0.5 truncate font-display text-lg font-semibold">{entry.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              by{" "}
              <Link to="/$username" params={{ username: entry.username }} className="hover:text-foreground">
                @{entry.username}
              </Link>
            </p>
          </div>
          {cover ? (
            <img
              src={cover}
              alt={`${entry.title} cover`}
              loading="lazy"
              className="hidden size-16 shrink-0 rounded-xl object-cover sm:block"
            />
          ) : null}
        </div>

        {entry.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
        ) : null}

        {entry.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {entry.tags.slice(0, 5).map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {entry.demo_url ? (
            <Button size="sm" variant="secondary" asChild>
              <a href={entry.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Demo
              </a>
            </Button>
          ) : null}
          {entry.repo_url ? (
            <Button size="sm" variant="ghost" asChild>
              <a href={entry.repo_url} target="_blank" rel="noopener noreferrer">
                <Github className="size-3.5" aria-hidden="true" />
                Code
              </a>
            </Button>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {entry.upvotes} up · {entry.downvotes} down
          </span>
          {isOwner ? (
            <span className="text-xs text-muted-foreground">You cannot vote on your own project</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
