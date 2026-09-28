import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  display_name: z.string().max(60),
  username: z.string().max(40),
  bio: z.string().max(300),
  location: z.string().max(80),
  focus: z.string().max(200),
  link_titles: z.array(z.string().max(80)).max(30),
  project_titles: z.array(z.string().max(120)).max(30),
});

export type SeoSuggestion = { title: string; description: string };

function clamp(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

export const generateProfileSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; suggestion: SeoSuggestion } | { ok: false; error: string }> => {
    const { generateTextViaGateway } = await import("./ai-gateway.server");
    const prompt = [
      `Name: ${data.display_name || "@" + data.username}`,
      `Username: ${data.username}`,
      data.bio && `Bio: ${data.bio}`,
      data.location && `Location: ${data.location}`,
      data.focus && `What they want to be found for: ${data.focus}`,
      data.link_titles.length && `Links: ${data.link_titles.join(", ")}`,
      data.project_titles.length && `Projects: ${data.project_titles.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const text = await generateTextViaGateway({
        system:
          "You write SEO metadata for a person's public link-in-bio page on LTReee. " +
          'Reply with ONLY a JSON object: {"title": string, "description": string}. ' +
          "Title: at most 60 characters, include the person's name, end with ' | LTReee' if it fits. " +
          "Description: 140-155 characters, natural, specific, mention what they do and what visitors find. " +
          "Never invent facts not given. No emojis, no quotes around the whole thing.",
        prompt,
      });
      const match = text.match(/\{[\s\S]*\}/);
      const parsed = match ? (JSON.parse(match[0]) as Partial<SeoSuggestion>) : null;
      if (!parsed?.title || !parsed?.description) return { ok: false, error: "The AI returned an unexpected answer. Try again." };
      return { ok: true, suggestion: { title: clamp(parsed.title, 70), description: clamp(parsed.description, 165) } };
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.error("[seo-ai]", err);
      if (status === 429) return { ok: false, error: "Too many requests right now. Please wait a moment and try again." };
      if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in Settings → Plans & credits." };
      if (status === 403) return { ok: false, error: "AI generation isn't available for this workspace right now." };
      return { ok: false, error: "Couldn't generate suggestions. Please try again." };
    }
  });
