import { avatars } from "@/app/dashboard/mock-data";

const STOCK_IMAGE_BY_ID = Object.fromEntries(
  avatars.map((avatar) => [avatar.id, avatar.imageUrl]),
) as Record<string, string>;

/**
 * Prefer a stored custom photo, then the library still for `avatar_id`.
 * Callers that need Anam-resolved previews can fall through further.
 */
export function resolveStockAvatarImage(
  avatarId: string | null | undefined,
  avatarImageUrl?: string | null,
): string | null {
  if (typeof avatarImageUrl === "string" && avatarImageUrl.trim()) {
    try {
      const url = new URL(avatarImageUrl);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch {
      // ignore invalid stored URLs
    }
  }

  if (typeof avatarId === "string" && STOCK_IMAGE_BY_ID[avatarId]) {
    return STOCK_IMAGE_BY_ID[avatarId];
  }

  return null;
}

export function stockAvatarImageUrl(avatarId: string | null | undefined): string | null {
  if (typeof avatarId !== "string") return null;
  return STOCK_IMAGE_BY_ID[avatarId] ?? null;
}
