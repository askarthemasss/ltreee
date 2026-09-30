import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/leaderboard-track")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("leaderboard_views" as never).insert({} as never);
        return new Response("ok");
      },
    },
  },
});
