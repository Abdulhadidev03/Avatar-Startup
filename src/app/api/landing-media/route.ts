import { NextResponse } from "next/server";

type AnamAvatar = {
  id?: string;
  displayName?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdByOrganizationId?: string | null;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ANAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ imageUrl: null, videoUrl: null }, { status: 200 });
  }

  try {
    const response = await fetch("https://api.anam.ai/v1/avatars", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Avatar media is unavailable");

    const payload = await response.json();
    const avatars: AnamAvatar[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.avatars)
          ? payload.avatars
          : [];
    const owned = avatars.find((avatar) => Boolean(avatar.createdByOrganizationId));

    if (!owned?.id) {
      return NextResponse.json({ imageUrl: null, videoUrl: null }, { status: 200 });
    }

    const detailResponse = await fetch(`https://api.anam.ai/v1/avatars/${owned.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    const detail: AnamAvatar = detailResponse.ok ? await detailResponse.json() : owned;

    return NextResponse.json(
      {
        id: detail.id ?? owned.id,
        name: detail.displayName ?? owned.displayName ?? "Ruhana guide",
        imageUrl: detail.imageUrl ?? owned.imageUrl ?? null,
        videoUrl: detail.videoUrl ?? owned.videoUrl ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
        },
      },
    );
  } catch {
    return NextResponse.json({ imageUrl: null, videoUrl: null }, { status: 200 });
  }
}
