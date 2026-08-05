import { NextResponse } from "next/server";
import { z } from "zod";
import { ALLOWED_EVENTS, track, type AnalyticsEventName } from "@/lib/analytics";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().max(60),
  props: z.record(z.union([z.string().max(120), z.number(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!ALLOWED_EVENTS.includes(parsed.name as AnalyticsEventName)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await track(parsed.name as AnalyticsEventName, parsed.props);
  return NextResponse.json({ ok: true });
}
