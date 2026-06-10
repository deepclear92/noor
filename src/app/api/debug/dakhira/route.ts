import { NextResponse } from "next/server";

/**
 * Endpoint de diagnostic pour la résolution des PDFs Dakhira.
 * GET /api/debug/dakhira → JSON avec :
 *   - hasToken : si BLOB_READ_WRITE_TOKEN est dispo côté serveur
 *   - blobs : liste des blobs trouvés (max 100)
 *   - dakhiraMatched : map des 56 volumes → url résolu
 *   - errors : trace en cas d'échec
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const result: {
    hasToken: boolean;
    tokenPrefix?: string;
    blobs: Array<{ pathname: string; url: string; size: number }>;
    dakhiraMatched: Record<number, string>;
    errors: string[];
    envKeys: string[];
  } = {
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 12) + "…",
    blobs: [],
    dakhiraMatched: {},
    errors: [],
    envKeys: Object.keys(process.env)
      .filter((k) => k.includes("BLOB") || k.includes("VERCEL") || k.startsWith("NEXT_"))
      .sort(),
  };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    result.errors.push("BLOB_READ_WRITE_TOKEN not set in env");
    return NextResponse.json(result);
  }

  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ limit: 200 });
    result.blobs = blobs.slice(0, 100).map((b) => ({
      pathname: b.pathname,
      url: b.url,
      size: b.size,
    }));
    for (const b of blobs) {
      const m = b.pathname.match(/dakira(\d{1,2})\.pdf$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 1 && n <= 56) result.dakhiraMatched[n] = b.url;
      }
    }
  } catch (err) {
    result.errors.push(`list() failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json(result);
}
