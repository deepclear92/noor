/**
 * Résolution des URLs des PDFs Dakhira.
 *
 * Ordre de résolution (du plus rapide au fallback) :
 *  1. Vercel Blob (si BLOB_READ_WRITE_TOKEN est dispo)
 *  2. NEXT_PUBLIC_DAKHIRA_BASE_URL (override custom — ex: Hostinger SFTP)
 *  3. archive.org direct (fallback toujours dispo)
 *
 * Le mapping volume→url est mis en cache pour la durée du process (le serveur
 * Vercel garde la map vivante entre requêtes tant que l'instance est chaude).
 */

let cachedBlobMap: Map<number, string> | null = null;
let lastFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchBlobMap(): Promise<Map<number, string>> {
  // Cache léger : évite de spammer l'API Blob
  if (cachedBlobMap && Date.now() - lastFetch < CACHE_TTL_MS) {
    return cachedBlobMap;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Map();
  }
  try {
    // Import dynamique pour éviter d'embarquer @vercel/blob côté client
    const { list } = await import("@vercel/blob");
    const map = new Map<number, string>();
    let cursor: string | undefined;
    // Pagination — récupère tous les blobs
    do {
      const result = await list({ limit: 1000, cursor });
      for (const b of result.blobs) {
        // Match dakira01.pdf à dakira56.pdf, peu importe le dossier
        const m = b.pathname.match(/dakira(\d{1,2})\.pdf$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n >= 1 && n <= 56) map.set(n, b.url);
        }
      }
      cursor = result.cursor;
    } while (cursor);

    cachedBlobMap = map;
    lastFetch = Date.now();
    return map;
  } catch (err) {
    console.error("[dakhira] Vercel Blob list() failed:", err);
    return new Map();
  }
}

export async function getDakhiraUrl(volNum: number): Promise<string> {
  const padded = String(volNum).padStart(2, "0");

  // 1. Vercel Blob (si configuré)
  const blobMap = await fetchBlobMap();
  const blobUrl = blobMap.get(volNum);
  if (blobUrl) return blobUrl;

  // 2. Override custom (env var)
  const baseUrl = process.env.NEXT_PUBLIC_DAKHIRA_BASE_URL;
  if (baseUrl) return `${baseUrl}/dakira${padded}.pdf`;

  // 3. Fallback : archive.org direct
  return `https://archive.org/download/Dakhirat-almuhtaj/dakira${padded}.pdf`;
}
