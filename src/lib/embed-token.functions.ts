import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Issues a signed tracking token for a published profile's embed render. */
export const getEmbedToken = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ username: z.string().min(1).max(50) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { issueEmbedToken } = await import("./embed-token.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", data.username.toLowerCase())
      .eq("is_published", true)
      .maybeSingle();
    if (!profile) return null;
    try {
      return issueEmbedToken(profile.id);
    } catch {
      return null;
    }
  });
