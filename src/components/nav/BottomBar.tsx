"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Library, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/dalail", label: "Dalail", icon: BookOpen },
  { href: "/dakhira", label: "Dakira", icon: Library },
  { href: "/recherche", label: "Recherche", icon: Search },
];

export function BottomBar() {
  const path = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur safe-bottom"
      aria-label="Navigation principale"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active =
            t.href === "/" ? path === "/" : path?.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
