"use client";

import Link from "next/link";
import { FileText, BookOpen } from "lucide-react";
import { ResumeReading } from "@/components/ResumeReading";
import { useReaderStore } from "@/lib/store";
import { useEffect, useState } from "react";

const volumes = Array.from({ length: 56 }, (_, i) => ({
  slug: `dakira-${String(i + 1).padStart(2, "0")}`,
  num: i + 1,
}));

export default function DakhiraIndexPage() {
  const pages = useReaderStore((s) => s.dakhiraPages);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <header className="mb-8 text-center">
        <p className="arabic-text font-arabic-diwani text-4xl text-accent mb-2">
          ذخيرة المحتاج
        </p>
        <h1 className="font-display text-3xl mb-2">Kitab Dakira</h1>
        <p className="text-muted text-sm max-w-2xl mx-auto">
          Encyclopédie en 56 volumes sur la prière sur le Prophète ﷺ. Lecteur
          PDF intégré, mémorise la dernière page lue par volume.
        </p>
        <p className="text-xs text-muted mt-3">
          Source :{" "}
          <a
            className="underline"
            href="https://archive.org/details/Dakhirat-almuhtaj/"
            target="_blank"
            rel="noopener"
          >
            archive.org/details/Dakhirat-almuhtaj
          </a>
        </p>
      </header>

      <ResumeReading book="dakhira" className="mb-8" />

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
        {volumes.map((v) => {
          const lastPage = mounted ? pages[v.slug] : undefined;
          return (
            <Link
              key={v.slug}
              href={`/dakhira/${v.slug}`}
              className="group rounded-lg border border-border bg-surface p-4 hover:shadow-sm transition-all hover:-translate-y-0.5 text-center relative"
            >
              <FileText className="size-5 text-accent mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="text-xs font-mono text-muted">Vol.</p>
              <p className="font-display text-2xl">{v.num}</p>
              {lastPage && lastPage > 1 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center gap-0.5 bg-primary text-primary-fg text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                  <BookOpen className="size-2.5" />
                  {lastPage}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
