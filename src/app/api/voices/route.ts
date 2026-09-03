import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const perPage = searchParams.get("perPage") ?? "50";

  const url = new URL("https://api.anam.ai/v1/voices");
  url.searchParams.set("perPage", perPage);
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.ANAM_API_KEY}` },
    next: { revalidate: 300 }, // cache for 5 minutes
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: res.status });
  }

  const json = await res.json();
  return NextResponse.json(json);
}
