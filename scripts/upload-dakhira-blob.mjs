#!/usr/bin/env node
/**
 * upload-dakhira-blob.mjs — Upload les PDFs Dakhira manquants vers Vercel Blob.
 *
 * Usage : node scripts/upload-dakhira-blob.mjs [N1 N2 ...]
 * Sans args : détecte les volumes manquants en interrogeant l'endpoint debug.
 * Requiert BLOB_READ_WRITE_TOKEN dans .env.local (généré via `vercel env pull`).
 */
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Charge .env.local
try {
  const env = await readFile(resolve(ROOT, ".env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.+?)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN manquant — lance `vercel env pull .env.local`");
  process.exit(1);
}

const { put, head } = await import("@vercel/blob");

const argv = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const TARGETS = argv.length
  ? argv
  : [2, 3, 4, 5, 6, 7, 8, 10, 12, 13, 15]; // les manquants connus

async function uploadVolume(num) {
  const padded = String(num).padStart(2, "0");
  const path = `dakhira/dakira${padded}.pdf`;
  const local = resolve(ROOT, "public/content/dakhira", `dakira${padded}.pdf`);

  try {
    await stat(local);
  } catch {
    console.log(`  ✗ Vol ${num}: fichier local absent — ${local}`);
    return null;
  }

  // Vérifie si déjà uploadé (head() renvoie metadata ou throw 404)
  try {
    const existing = await head(
      `https://wwgvzr3xehudn6kc.public.blob.vercel-storage.com/${path}`,
    );
    if (existing) {
      console.log(`  ⤳ Vol ${num}: déjà sur Blob (${(existing.size / 1024 / 1024).toFixed(1)} MiB)`);
      return existing.url;
    }
  } catch {
    // pas trouvé, on upload
  }

  const buf = await readFile(local);
  process.stdout.write(`  ↑ Vol ${num} (${(buf.length / 1024 / 1024).toFixed(1)} MiB)…`);
  try {
    const blob = await put(path, buf, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
      // Passe le token explicite (sinon le SDK tente OIDC en dev/CLI)
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(` ✓`);
    return blob.url;
  } catch (err) {
    console.log(` ✗ ${err.message}`);
    return null;
  }
}

console.log(`Upload de ${TARGETS.length} volume(s) sur Vercel Blob…`);
const results = [];
for (const n of TARGETS) {
  const url = await uploadVolume(n);
  results.push({ num: n, url });
}

const ok = results.filter((r) => r.url).length;
console.log(`\n✓ ${ok}/${TARGETS.length} volumes en place`);
