import { ImageResponse } from "next/og";
import { brand } from "@/lib/site";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Browser-tab icon: the initials on the site's ground colour, with the accent underline.
export default function Icon() {
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
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        MG
        <div style={{ width: 30, height: 4, marginTop: 3, background: brand.accent }} />
      </div>
    ),
    size,
  );
}
