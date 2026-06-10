"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Settings, BookOpen, Library, Sliders } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReaderStore } from "@/lib/store";

const links = [
  { href: "/dalail", label: "Dalail al-Khayrat", icon: BookOpen },
  { href: "/dakhira", label: "Kitab Dakira", icon: Library },
  { href: "/recherche", label: "Recherche", icon: Search },
];

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const inReader = useReaderStore((s) => s.inReader);
  const showReaderSettings = useReaderStore((s) => s.showReaderSettings);
  const setShowReaderSettings = useReaderStore(
    (s) => s.setShowReaderSettings,
  );

  // Quand on est sur une page Reader, le bouton ⚙️ ouvre le panneau de
  // réglages contextuel ; sinon il navigue vers /reglages.
  const handleSettingsClick = (e: React.MouseEvent) => {
    if (inReader) {
      e.preventDefault();
      setShowReaderSettings(!showReaderSettings);
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-fg text-base">
            ن
          </span>
          <span className="hidden sm:inline tracking-wide">Noor</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = path?.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors",
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:text-foreground hover:bg-surface-2",
                )}
              >
                <Icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/recherche"
            className="md:hidden p-2 rounded-md hover:bg-surface-2"
            aria-label="Recherche"
          >
            <Search className="size-5" />
          </Link>
          {inReader ? (
            <button
              onClick={() => setShowReaderSettings(!showReaderSettings)}
              className={cn(
                "p-2 rounded-md hover:bg-surface-2 transition-colors",
                showReaderSettings && "bg-surface-2 text-primary",
              )}
              aria-label="Réglages d'affichage"
              title="Réglages du lecteur"
            >
              <Sliders className="size-5" />
            </button>
          ) : (
            <Link
              href="/reglages"
              onClick={handleSettingsClick}
              className="p-2 rounded-md hover:bg-surface-2"
              aria-label="Réglages"
            >
              <Settings className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
