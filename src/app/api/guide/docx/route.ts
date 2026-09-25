import { NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { GUIDE_SECTIONS } from "@/lib/guide-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/guide/docx — returns a Word-ready HTML (can be opened in Word as .doc). */
export async function GET() {
  await ensureSeed();
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8">
<title>YFG Guide</title>
<style>
  body { font-family: 'Vazirmatn', sans-serif; padding: 32px; line-height: 1.7; }
  h1 { color: #047857; }
  h2 { color: #065f46; margin-top: 32px; }
  pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
  code { font-family: monospace; background: #f3f4f6; padding: 2px 4px; }
</style>
</head>
<body>
<h1>راهنمای YFG AI Software Factory</h1>
${GUIDE_SECTIONS.map((s) => `<h2>${s.title}</h2><div>${s.content}</div>`).join("\n")}
</body>
</html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/vnd.ms-word",
      "Content-Disposition": `attachment; filename="yfg-guide.doc"`,
    },
  });
}
