import { NextResponse } from "next/server";
import { buildDiscoverCollections } from "@/services/ktie/discover";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const monthParam = parseInt(url.searchParams.get("month") ?? "", 10);
  const month =
    !Number.isNaN(monthParam) && monthParam >= 1 && monthParam <= 12
      ? monthParam
      : new Date().getMonth() + 1;
  return NextResponse.json({ month, collections: buildDiscoverCollections(month) });
}
