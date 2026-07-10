import { ImageResponse } from "next/og";
import { getRecipeByShareToken } from "@/lib/recipes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAMP_GRADIENT = "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let recipe: Awaited<ReturnType<typeof getRecipeByShareToken>> = null;
  try {
    recipe = await getRecipeByShareToken(token);
  } catch {
    recipe = null;
  }

  if (recipe?.imageUrl) {
    try {
      return new ImageResponse(
        (
          <div style={{ width: "100%", height: "100%", display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              width={size.width}
              height={size.height}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
        ),
        size,
      );
    } catch {
      // Fall through to the branded card if the photo fetch fails.
    }
  }

  const name = recipe?.name ?? "Ask Ah Mah";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: STAMP_GRADIENT,
          padding: 64,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50% 50% 50% 10px",
            background: "rgba(255,255,255,0.15)",
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 32,
            transform: "rotate(-3deg)",
          }}
        >
          阿
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>{name}</div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 16 }}>from Ah Mah&apos;s kitchen</div>
      </div>
    ),
    size,
  );
}
