import { ImageResponse } from "next/og";
import { profile } from "@/lib/content/profile";
import { brand } from "@/lib/site";

export const alt = `${profile.name}, Developer Trainee at Sahayogi One and final-year CSE student at Bennett University`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link preview on LinkedIn, WhatsApp and X. Plain facts, set like the hero.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: brand.ground,
          backgroundImage: `linear-gradient(${brand.line} 1px, transparent 1px), linear-gradient(90deg, ${brand.line} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          color: brand.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>
            {profile.name.toUpperCase()}
          </div>
          <div style={{ width: 120, height: 6, marginTop: 28, background: brand.accent }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 40, lineHeight: 1.2 }}>Developer Trainee at Sahayogi One</div>
          <div style={{ fontSize: 30, color: brand.inkDim, lineHeight: 1.3 }}>
            {`Final-year B.Tech CSE, Bennett University · Graduating ${profile.graduation}`}
          </div>
          <div style={{ fontSize: 26, color: brand.accent, marginTop: 10 }}>
            {profile.openTo}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
