import Link from "next/link";
import { BookOpen, Library, Search, Sparkles, BookMarked, Clock } from "lucide-react";
import { getDalailIndex } from "@/lib/content";
import { ResumeReading } from "@/components/ResumeReading";

const days = [
  { slug: "hizb-1-lundi", num: 1, day: "Lundi", ar: "الإثنين" },
  { slug: "hizb-2-mardi", num: 2, day: "Mardi", ar: "الثلاثاء" },
  { slug: "hizb-3-mercredi", num: 3, day: "Mercredi", ar: "الأربعاء" },
  { slug: "hizb-4-jeudi", num: 4, day: "Jeudi", ar: "الخميس" },
  { slug: "hizb-5-vendredi", num: 5, day: "Vendredi", ar: "الجمعة" },
  { slug: "hizb-6-samedi", num: 6, day: "Samedi", ar: "السبت" },
  { slug: "hizb-7-dimanche", num: 7, day: "Dimanche", ar: "الأحد" },
  { slug: "hizb-8-lundi-2", num: 8, day: "Lundi (2)", ar: "الإثنين" },
];

export default async function Home() {
  const idx = await getDalailIndex();
  const todayIndex = new Date().getDay(); // 0 = dimanche
  const jsDayToHizb = [7, 1, 2, 3, 4, 5, 6];
  const todayHizb = jsDayToHizb[todayIndex];
  const todayCard = days.find((d) => d.num === todayHizb)!;

  const sourates = idx.sectionsMeta.filter((s) =>
    ["ya-sin", "al-fath", "al-waqia"].includes(s.slug),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <section className="text-center mb-10">
        <p className="arabic-text font-arabic-amiri text-2xl sm:text-3xl text-accent mb-3">
          ﷺ
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mb-3 tracking-tight">
          Sur lui les prières et la paix
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Une bibliothèque numérique vivante pour les recueils de prières sur le Prophète ﷺ.
        </p>
      </section>

      {/* Reprendre la lecture */}
      <ResumeReading className="mb-6" />

      {/* Aujourd'hui */}
      <section className="mb-10">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">
                Lecture du jour
              </p>
              <h2 className="font-display text-3xl mb-1">
                Hizb {todayCard.num} — {todayCard.day}
              </h2>
              <p className="arabic-text font-arabic-amiri text-xl text-muted">
                {todayCard.ar}
              </p>
              <p className="text-sm text-muted mt-3 max-w-md">
                Selon l'ordre traditionnel établi par l'Imam al-Jazuli, chaque
                jour de la semaine a son hizb dédié.
              </p>
            </div>
            <Link
              href={`/dalail/${todayCard.slug}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-fg font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              <BookOpen className="size-4" />
              Lire maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Sections principales */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <FeatureCard
          href="/dalail"
          icon={BookOpen}
          title="Dalail al-Khayrat"
          ar="دلائل الخيرات"
          desc="Le recueil de l'Imam al-Jazuli — 8 ahzab + qasaid (Burda, Mashishiyya, Munfarija) + du'as et Hizb an-Nasr."
        />
        <FeatureCard
          href="/dakhira"
          icon={Library}
          title="Kitab Dakira"
          ar="ذخيرة المحتاج"
          desc="L'encyclopédie de la prière sur le Prophète ﷺ en 56 volumes."
        />
        <FeatureCard
          href="/recherche"
          icon={Search}
          title="Recherche"
          ar="بحث"
          desc="Rechercher dans le texte arabe, la translittération ou la traduction."
        />
      </section>

      {/* Semaine */}
      <section className="mb-12">
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <Clock className="size-5 text-accent" />
          La semaine de Dalail
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {days.map((d) => {
            const isToday = d.num === todayHizb;
            return (
              <Link
                key={d.slug}
                href={`/dalail/${d.slug}`}
                className={`group rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  isToday
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted">
                    Hizb {d.num}
                  </span>
                  {isToday && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                      Aujourd'hui
                    </span>
                  )}
                </div>
                <p className="font-medium">{d.day}</p>
                <p className="arabic-text font-arabic-amiri text-sm text-muted">
                  {d.ar}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sourates introductives */}
      <section className="mb-12">
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          Sourates introductives
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {sourates.map((s) => (
            <Link
              key={s.slug}
              href={`/dalail/${s.slug}`}
              className="rounded-xl border border-border bg-surface p-4 hover:shadow-sm transition-shadow"
            >
              <p className="arabic-text font-arabic-amiri text-xl mb-1">
                {s.ar}
              </p>
              <p className="font-medium">{s.fr}</p>
              {s.durationMin && (
                <p className="text-xs text-muted mt-1">~{s.durationMin} min</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Qasaid */}
      <section className="mb-12">
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <BookMarked className="size-5 text-accent" />
          Qasaid, du'as & ahzab additionnels
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {idx.sectionsMeta
            .filter((s) => s.category === "qasaid" && !s.slug.startsWith("bio-"))
            .map((s) => (
              <Link
                key={s.slug}
                href={`/dalail/${s.slug}`}
                className="rounded-xl border border-border bg-surface p-4 hover:shadow-sm transition-shadow"
              >
                <p className="arabic-text font-arabic-diwani text-2xl mb-1">
                  {s.ar}
                </p>
                <p className="font-medium">{s.fr}</p>
                {s.hint && (
                  <p className="text-xs text-muted mt-0.5">{s.hint}</p>
                )}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  href,
  icon: Icon,
  title,
  ar,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  ar: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-surface p-5 hover:shadow-sm transition-all hover:-translate-y-0.5"
    >
      <div className="size-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-fg transition-colors">
        <Icon className="size-5" />
      </div>
      <p className="arabic-text font-arabic-amiri text-lg text-muted mb-1">
        {ar}
      </p>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted">{desc}</p>
    </Link>
  );
}
