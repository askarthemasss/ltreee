import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateProfileSeo } from "@/lib/seo-ai.functions";
import { useUpdateProfile, type Profile } from "@/hooks/useLTReee";

export function SeoGenerator({
  profile,
  details,
  linkTitles,
}: {
  profile: Profile;
  details: { display_name: string; bio: string; location: string };
  linkTitles: string[];
}) {
  const generate = useServerFn(generateProfileSeo);
  const updateProfile = useUpdateProfile();
  const [focus, setFocus] = useState("");
  const [title, setTitle] = useState(profile.seo_title ?? "");
  const [description, setDescription] = useState(profile.seo_description ?? "");
  const [loading, setLoading] = useState(false);

  const dirty = title !== (profile.seo_title ?? "") || description !== (profile.seo_description ?? "");

  async function onGenerate() {
    setLoading(true);
    try {
      const res = await generate({
        data: {
          display_name: details.display_name.slice(0, 60),
          username: profile.username,
          bio: details.bio.slice(0, 300),
          location: details.location.slice(0, 80),
          focus: focus.slice(0, 200),
          link_titles: linkTitles.slice(0, 30).map((t) => t.slice(0, 80)),
          project_titles: [],
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setTitle(res.suggestion.title);
      setDescription(res.suggestion.description);
      toast.success("Suggestion ready — review and save");
    } catch {
      toast.error("Couldn't generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        seo_title: title.trim() || null,
        seo_description: description.trim() || null,
      });
      toast.success("Search details saved");
    } catch {
      toast.error("Couldn't save. Titles max 70 and descriptions max 170 characters.");
    }
  }

  return (
    <section className="rounded-2xl glass p-5 sm:p-6" aria-labelledby="seo-heading">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        <h2 id="seo-heading" className="text-base font-semibold">
          Search appearance
        </h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Let AI write the title and description Google shows for your page, based on your profile.
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="seo_focus">What do you want to be found for? (optional)</Label>
          <Input
            id="seo_focus"
            value={focus}
            maxLength={200}
            placeholder="e.g. React developer, open-source, freelance web design"
            onChange={(e) => setFocus(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void onGenerate()} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {loading ? "Writing…" : title ? "Regenerate with AI" : "Generate with AI"}
        </Button>

        <div className="space-y-2">
          <Label htmlFor="seo_title">Page title</Label>
          <Input id="seo_title" value={title} maxLength={70} placeholder={`${details.display_name || profile.username} — LTReee`} onChange={(e) => setTitle(e.target.value)} />
          <p className="text-xs text-muted-foreground">{title.length}/70 · best under 60</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo_description">Meta description</Label>
          <Textarea id="seo_description" value={description} maxLength={170} rows={3} placeholder="A short summary shown under your title in search results." onChange={(e) => setDescription(e.target.value)} />
          <p className="text-xs text-muted-foreground">{description.length}/170 · best 140–155</p>
        </div>

        {(title || description) && (
          <div className="rounded-xl border border-border/60 p-4" aria-label="Search result preview">
            <p className="text-xs text-muted-foreground">ltreee.app › {profile.username}</p>
            <p className="mt-1 truncate text-base font-medium text-primary">{title || `${details.display_name} — LTReee`}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
          </div>
        )}

        <Button type="button" onClick={() => void onSave()} disabled={!dirty || updateProfile.isPending}>
          {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Save search details
        </Button>
      </div>
    </section>
  );
}
