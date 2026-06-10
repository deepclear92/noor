#!/usr/bin/env node
/**
 * fetch-dakhira.mjs — Télécharge les 56 volumes de Dakhirat al-Muhtaj
 * depuis archive.org vers public/content/dakhira/.
 *
 * Usage :
 *   node scripts/fetch-dakhira.mjs            # télécharge tous les volumes
 *   node scripts/fetch-dakhira.mjs 1 5 12     # télécharge uniquement ces volumes
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "public/content/dakhira");

const BASE = "https://archive.org/download/Dakhirat-almuhtaj";

const argv = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const TARGETS = argv.length ? argv : Array.from({ length: 56 }, (_, i) => i + 1);

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function download(num) {
  const padded = String(num).padStart(2, "0");
  const filename = `dakira${padded}.pdf`;
  const url = `${BASE}/${filename}`;
  const dest = resolve(OUT_DIR, filename);

  if (await exists(dest)) {
    console.log(`  ⤳ ${filename} existe déjà — passage`);
    return;
  }

  process.stdout.write(`  ↓ ${filename}…`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    console.log(` ❌ ${res.status}`);
    return;
  }
  const total = Number(res.headers.get("content-length") ?? 0);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log(` ✓ ${(total / 1_048_576).toFixed(1)} MiB`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Téléchargement de ${TARGETS.length} volume(s) → ${OUT_DIR}`);
  for (const n of TARGETS) {
    try {
      await download(n);
    } catch (err) {
      console.error(`  ✗ volume ${n} : ${err.message}`);
    }
  }
  // index.json
  const index = TARGETS.map((n) => ({
    num: n,
    slug: `dakira-${String(n).padStart(2, "0")}`,
    file: `/content/dakhira/dakira${String(n).padStart(2, "0")}.pdf`,
  }));
  await writeFile(
    resolve(OUT_DIR, "index.json"),
    JSON.stringify(index, null, 2),
    "utf-8",
  );
  console.log("Terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
