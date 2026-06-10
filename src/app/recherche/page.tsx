"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import { normalizeArabic } from "@/lib/arabic";

type Row = {
  bookSlug: string;
  sectionSlug: string;
  sectionFr: string;
  sectionAr: string;
  lineId: string;
  ar: string;
  arNorm: string;
  translit?: string;
  tr?: string;
};

export default function RecherchePage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((d: { rows: Row[] }) => {
        if (cancelled) return;
        setData(d.rows ?? []);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys: ["arNorm", "translit", "tr", "sectionFr"],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [data],
  );

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const isArabic = /[؀-ۿ]/.test(q);
    const query = isArabic ? normalizeArabic(q) : q;
    return fuse.search(query, { limit: 80 });
  }, [q, fuse]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl mb-2">Recherche</h1>
        <p className="text-muted text-sm">
          Cherche dans le texte arabe (vocalisation ignorée), la translittération
          ou la traduction.
        </p>
      </header>

      <div className="relative mb-6">
        <SearchIcon className="size-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        {loading && (
          <Loader2 className="size-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ex: Allahumma salli, Au nom d'Allah, اللهم صل…"
          className="w-full pl-11 pr-10 h-12 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading && (
        <p className="text-muted text-sm">Chargement de l'index ({data.length} lignes)…</p>
      )}

      {!loading && q && results.length === 0 && (
        <p className="text-muted">Aucun résultat pour « {q} ».</p>
      )}

      {!loading && !q && (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          <p className="mb-2 font-medium text-foreground">
            Index : {data.length.toLocaleString("fr-FR")} lignes indexées
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La recherche arabe ignore les voyelles courtes (tashkil).</li>
            <li>Tu peux taper en français, anglais ou arabe.</li>
            <li>Astuce : tape au moins 2 caractères.</li>
          </ul>
        </div>
      )}

      <ul className="space-y-3">
        {results.map(({ item }) => (
          <li key={`${item.sectionSlug}-${item.lineId}`}>
            <Link
              href={`/${item.bookSlug}/${item.sectionSlug}#${item.lineId}`}
              className="block rounded-xl border border-border bg-surface p-4 hover:shadow-sm"
            >
              <p className="text-xs text-accent font-semibold mb-1">
                Dalail • {item.sectionFr}
              </p>
              <p className="arabic-text font-arabic-amiri text-lg leading-relaxed">
                {item.ar}
              </p>
              {item.translit && (
                <p className="text-sm text-muted italic mt-1">{item.translit}</p>
              )}
              {item.tr && <p className="text-sm mt-1">{item.tr}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
