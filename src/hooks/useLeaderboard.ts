import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  castVote,
  getLeaderboard,
  getMyVotes,
  type LeaderboardEntry,
} from "@/lib/leaderboard.functions";

export const leaderboardQueryKey = ["leaderboard"] as const;
export const myVotesQueryKey = ["leaderboard", "my-votes"] as const;

export function useLeaderboard() {
  const fetchLeaderboard = useServerFn(getLeaderboard);
  return useQuery<LeaderboardEntry[]>({
    queryKey: leaderboardQueryKey,
    queryFn: () => fetchLeaderboard(),
  });
}

export function useMyVotes(enabled: boolean) {
  const fetchVotes = useServerFn(getMyVotes);
  return useQuery<Record<string, number>>({
    queryKey: myVotesQueryKey,
    enabled,
    queryFn: () => fetchVotes(),
  });
}

export function useVote() {
  const qc = useQueryClient();
  const vote = useServerFn(castVote);
  return useMutation({
    mutationFn: (input: { projectId: string; value: -1 | 0 | 1 }) => vote({ data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leaderboardQueryKey });
    },
  });
}
