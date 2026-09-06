import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ANAM_BASE = "https://api.anam.ai/v1";

function anamHeaders() {
  const apiKey = process.env.ANAM_API_KEY;
  if (!apiKey) return null;
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Find and delete any existing one-shot (custom) avatars to free the slot.
 * Anam's non-enterprise plans only allow 1 custom avatar at a time.
 */
async function freeAnamAvatarSlot(headers: { Authorization: string }) {
  try {
    const listRes = await fetch(`${ANAM_BASE}/avatars`, { headers, cache: "no-store" });
    if (!listRes.ok) return;

    const payload = await listRes.json();
    const avatars = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const customAvatars = avatars.filter(
      (a: { createdByOrganizationId?: string | null }) => a.createdByOrganizationId != null,
    );

    for (const avatar of customAvatars) {
      if (!avatar.id) continue;
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
    const headers = anamHeaders();
    if (!headers) {
      return NextResponse.json({ error: "Anam is not configured." }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const displayName = ((form.get("displayName") as string) || "Custom Avatar").slice(0, 50);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 4.5MB or smaller." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 1. Upload to Supabase Storage (card / widget still image)
    const { error } = await supabaseAdmin.storage
      .from("agent-avatars")
      .upload(fileName, bytes, {
        contentType: file.type || "image/jpeg",
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
    await freeAnamAvatarSlot(headers);

    // 3. Create talking avatar on Anam via multipart (more reliable than remote URL fetch)
    const anamForm = new FormData();
    anamForm.append("displayName", displayName.length >= 3 ? displayName : "Custom Avatar");
    anamForm.append("avatarModel", "cara-4");
    anamForm.append(
      "imageFile",
      new Blob([bytes], { type: file.type || "image/jpeg" }),
      file.name || fileName,
    );

    const anamRes = await fetch(`${ANAM_BASE}/avatars`, {
      method: "POST",
      headers,
      body: anamForm,
    });

    if (!anamRes.ok) {
      const errText = await anamRes.text();
      console.error("Anam avatar creation failed:", anamRes.status, errText);
      return NextResponse.json(
        {
          error: "Anam could not create a talking avatar from this photo.",
          detail: errText.slice(0, 500),
          url: publicUrl,
          anamAvatarId: null,
        },
        { status: 502 },
      );
    }

    const anamData = await anamRes.json();
    const anamAvatarId = typeof anamData.id === "string" ? anamData.id : null;
    if (!anamAvatarId) {
      return NextResponse.json(
        { error: "Anam returned an invalid avatar id.", url: publicUrl, anamAvatarId: null },
        { status: 502 },
      );
    }

    console.log("Anam avatar created:", anamAvatarId);

    return NextResponse.json({
      url: publicUrl,
      anamAvatarId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
