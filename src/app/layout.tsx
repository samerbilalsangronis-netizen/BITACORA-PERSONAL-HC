import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TraderMind — Bitácora Personal",
  description: "Bitácora privada de disciplina, emociones y metas para traders.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("tm-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

// Guarda la zona horaria real del navegador en una cookie para que el
// servidor sepa qué día es "hoy" para este usuario (en vez de usar UTC,
// que puede diferir varias horas — ver src/lib/server-date.ts).
const TZ_COOKIE_SCRIPT = `
(function () {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && document.cookie.indexOf("tm-tz=" + tz) === -1) {
      document.cookie = "tm-tz=" + tz + ";path=/;max-age=31536000;SameSite=Lax";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: TZ_COOKIE_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
