import { ImageResponse } from "next/og";
import { brand } from "@/lib/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon for iOS. Same mark as app/icon.tsx, drawn larger.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: brand.ground,
          color: brand.ink,
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        MG
        <div style={{ width: 84, height: 10, marginTop: 8, background: brand.accent }} />
      </div>
    ),
    size,
  );
}
