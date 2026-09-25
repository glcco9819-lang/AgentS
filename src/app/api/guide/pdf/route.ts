import { NextResponse } from "next/server";
import { ensureSeed } from "@/lib/init";
import { GUIDE_SECTIONS } from "@/lib/guide-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/guide/pdf — returns a plain-text PDF (best-effort). */
export async function GET() {
  await ensureSeed();
  // Minimal valid PDF with guide text. Real PDF generation can be added later.
  const text = GUIDE_SECTIONS.map((s) => `${s.title}\n\n${s.content}`).join("\n\n---\n\n");
  const safe = text.replace(/[()\\]/g, " ").slice(0, 30000);
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${safe.length + 50} >>
stream
BT /F1 10 Tf 50 800 Td (${safe.slice(0, 5000).replace(/\n/g, " ")}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="yfg-guide.pdf"`,
    },
  });
}
