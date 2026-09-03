import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ANAM_BASE = "https://api.anam.ai/v1";

async function anamHeaders() {
  return {
    Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
  };
}

/**
 * Find and delete any existing one-shot (custom) avatars to free the slot.
 * Anam's non-enterprise plans only allow 1 custom avatar at a time.
 */
async function freeAnamAvatarSlot() {
  try {
    const headers = await anamHeaders();
    const listRes = await fetch(`${ANAM_BASE}/avatars`, { headers });
    if (!listRes.ok) return;

    const { data: avatars } = await listRes.json();
    if (!Array.isArray(avatars)) return;

    // One-shot avatars are ones created by the org (createdByOrganizationId is not null)
    const customAvatars = avatars.filter(
      (a: { createdByOrganizationId: string | null }) => a.createdByOrganizationId !== null
    );

    for (const avatar of customAvatars) {
      await fetch(`${ANAM_BASE}/avatars/${avatar.id}`, {
        method: "DELETE",
        headers,
      });
      console.log("Deleted old Anam avatar:", avatar.id, avatar.displayName);
    }
  } catch (err) {
    console.error("Failed to free Anam avatar slot:", err);
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const displayName = (form.get("displayName") as string) || "Custom Avatar";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    // 1. Upload to Supabase Storage (for card/display image)
    const { error } = await supabaseAdmin.storage
      .from("agent-avatars")
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("agent-avatars")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 2. Free existing custom avatar slot (plan limit: 1 one-shot avatar)
    await freeAnamAvatarSlot();

    // 3. Create a real talking avatar on Anam using the public URL
    let anamAvatarId: string | null = null;
    try {
      const headers = await anamHeaders();
      const anamRes = await fetch(`${ANAM_BASE}/avatars`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          imageUrl: publicUrl,
          avatarModel: "cara-4",
        }),
      });

      if (anamRes.ok) {
        const anamData = await anamRes.json();
        anamAvatarId = anamData.id ?? null;
        console.log("Anam avatar created:", anamAvatarId);
      } else {
        const errText = await anamRes.text();
        console.error("Anam avatar creation failed:", anamRes.status, errText);
      }
    } catch (anamErr) {
      console.error("Anam avatar creation error:", anamErr);
    }

    return NextResponse.json({
      url: publicUrl,
      anamAvatarId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
