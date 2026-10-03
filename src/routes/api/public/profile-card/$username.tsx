import { ImageResponse } from "@vercel/og";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ShareProfile = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

function initials(name: string, username: string) {
  return (name.trim() || username)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const Route = createFileRoute("/api/public/profile-card/$username")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const username = params.username.toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(username)) {
          return new Response("Not found", { status: 404 });
        }

        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data } = await supabase
          .from("public_profiles" as never)
          .select("username, display_name, bio, avatar_url")
          .eq("username", username)
          .maybeSingle();

        if (!data) return new Response("Not found", { status: 404 });

        const profile = data as unknown as ShareProfile;
        const name = profile.display_name || `@${profile.username}`;
        const avatarEndpoint = profile.avatar_url
          ? new URL(
              `/api/public/avatar/${profile.avatar_url
                .split("/")
                .map(encodeURIComponent)
                .join("/")}`,
              request.url,
            ).toString()
          : null;
        let avatarUrl: string | null = null;
        if (avatarEndpoint) {
          const avatarResponse = await fetch(avatarEndpoint);
          if (avatarResponse.ok) {
            const mime = avatarResponse.headers.get("content-type") || "image/jpeg";
            const bytes = new Uint8Array(await avatarResponse.arrayBuffer());
            avatarUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
          }
        }

        return new ImageResponse(
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              color: "#f7f7f7",
              background: "#030303",
              fontFamily: "sans-serif",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                opacity: 0.5,
                backgroundImage:
                  "radial-gradient(circle at 18% 25%, #ffffff 0 1px, transparent 1.5px), radial-gradient(circle at 78% 18%, #ffffff 0 1px, transparent 1.5px), radial-gradient(circle at 84% 76%, #ffffff 0 1px, transparent 1.5px), radial-gradient(circle at 32% 82%, #ffffff 0 1px, transparent 1.5px)",
                backgroundSize: "180px 180px, 230px 230px, 270px 270px, 310px 310px",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 1050,
                alignItems: "center",
                gap: 64,
                padding: "72px 80px",
                border: "1px solid #292929",
                borderRadius: 28,
                background: "rgba(10, 10, 10, 0.92)",
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 220,
                  display: "flex",
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "2px solid #5b5b5b",
                  borderRadius: 999,
                  background: "#171717",
                  fontSize: 70,
                  fontWeight: 700,
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} width="220" height="220" style={{ objectFit: "cover" }} />
                ) : (
                  initials(name, profile.username) || "★"
                )}
              </div>
              <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
                <div style={{ display: "flex", color: "#a3a3a3", fontSize: 28, marginBottom: 16 }}>
                  ltreee.app/{profile.username}
                </div>
                <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.05 }}>
                  {name}
                </div>
                <div style={{ display: "flex", color: "#b8b8b8", fontSize: 28, marginTop: 14 }}>
                  @{profile.username}
                </div>
                {profile.bio ? (
                  <div
                    style={{
                      display: "flex",
                      color: "#d1d1d1",
                      fontSize: 26,
                      lineHeight: 1.35,
                      marginTop: 24,
                      maxHeight: 72,
                      overflow: "hidden",
                    }}
                  >
                    {profile.bio.slice(0, 145)}
                  </div>
                ) : null}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                right: 56,
                bottom: 34,
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#d4d4d4",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              <span style={{ display: "flex", color: "#ffffff" }}>✦</span> LTReee
            </div>
          </div>,
          {
            width: 1200,
            height: 630,
            headers: {
              "cache-control": "public, max-age=300, stale-while-revalidate=86400",
            },
          },
        );
      },
    },
  },
});