import { ImageResponse } from "next/og";
import { BRAND_COLORS } from "@/components/brand/BrandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS adds its own rounded corners, so the tile here is a full square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: BRAND_COLORS.plum }}>
        <svg viewBox="0 0 64 64" width="180" height="180">
          <rect x="9" y="33" width="46" height="13" rx="5" fill={BRAND_COLORS.highlight} transform="rotate(-7 32 39.5)" />
          <circle cx="32" cy="31" r="13" fill="none" stroke={BRAND_COLORS.paper} strokeWidth="7" />
        </svg>
      </div>
    ),
    size
  );
}
