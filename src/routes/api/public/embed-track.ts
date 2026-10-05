import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const LAYOUTS = ["vertical", "horizontal", "grid", "icons"] as const;
const THEMES = ["dark", "light", "transparent"] as const;

const bodySchema = z.object({
  token: z.string().min(1).max(300),
  layout: z.enum(LAYOUTS),
  theme: z.enum(THEMES),
});

export const Route = createFileRoute("/api/public/embed-track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) return new Response("Bad request", { status: 400 });

        const { verifyEmbedToken } = await import("@/lib/embed-token.server");
        // Only views from a freshly rendered embed (server-signed token) count.
        const verified = verifyEmbedToken(parsed.data.token);
        if (!verified) return new Response("Forbidden", { status: 403 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", verified.profileId)
          .eq("is_published", true)
          .maybeSingle();
        if (!profile) return new Response("Not found", { status: 404 });

        // One view per token: the unique nonce index rejects replays.
        await supabaseAdmin.from("embed_views" as never).insert({
          profile_id: profile.id,
          layout: parsed.data.layout,
          theme: parsed.data.theme,
          nonce: verified.nonce,
        } as never);
        return new Response("ok");
      },
    },
  },
});
