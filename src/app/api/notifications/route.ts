import { NextRequest, NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { notify, getNotifications, listAllNotifications, markRead } from "@/lib/notifications/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const url = new URL(req.url);
  const recipient = url.searchParams.get("recipient");
  const unread = url.searchParams.get("unread") === "true";
  if (recipient) {
    const ns = await getNotifications(recipient, unread);
    return NextResponse.json({ notifications: ns });
  }
  const ns = await listAllNotifications();
  return NextResponse.json({ notifications: ns });
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.recipient || !body.title || !body.message) {
    return NextResponse.json({ error: "recipient, title, message required" }, { status: 400 });
  }
  const n = await notify({
    recipient: body.recipient,
    type: body.type ?? "info",
    title: body.title,
    message: body.message,
    link: body.link,
  });
  return NextResponse.json({ notification: n });
}

export async function PATCH(req: NextRequest) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const n = await markRead(body.id);
  return NextResponse.json({ notification: n });
}
