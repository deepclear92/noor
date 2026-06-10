import type { Metadata, Viewport } from "next";
import {
  Inter,
  Cormorant_Garamond,
  Amiri,
  Amiri_Quran,
  Scheherazade_New,
  Noto_Naskh_Arabic,
  Reem_Kufi,
  Aref_Ruqaa,
  Mirza,
} from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/nav/TopBar";
import { BottomBar } from "@/components/nav/BottomBar";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";

// Latin
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

// Arabe — chaque police exposée comme variable CSS, utilisée par les classes
// .font-arabic-* dans globals.css.
const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
});
const amiriQuran = Amiri_Quran({
  variable: "--font-amiri-quran",
  weight: "400",
  subsets: ["arabic"],
  display: "swap",
});
const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
});
const notoNaskh = Noto_Naskh_Arabic({
  variable: "--font-noto-naskh",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
});
const reemKufi = Reem_Kufi({
  variable: "--font-reem-kufi",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
});
const arefRuqaa = Aref_Ruqaa({
  variable: "--font-aref-ruqaa",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
});
const mirza = Mirza({
  variable: "--font-mirza",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Noor — Recueil de prières sur le Prophète ﷺ",
    template: "%s — Noor",
  },
  description:
    "Dalail al-Khayrat, Dakhirat al-Muhtaj et autres recueils de prières sur le Prophète ﷺ. Lecteur arabe paramétrable, translittération et traduction.",
  applicationName: "Noor",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noor",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontVars = [
    inter.variable,
    cormorant.variable,
    amiri.variable,
    amiriQuran.variable,
    scheherazade.variable,
    notoNaskh.variable,
    reemKufi.variable,
    arefRuqaa.variable,
    mirza.variable,
  ].join(" ");

  return (
    <html
      lang="fr"
      className={`${fontVars} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeBootstrap />
        <TopBar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomBar />
      </body>
    </html>
  );
}
