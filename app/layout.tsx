import type { Metadata, Viewport } from "next";
import { Mulish, Archivo } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import SwRegister from "@/components/SwRegister";
import Splash from "@/components/Splash";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Fonte display condensada — usada SÓ na wordmark STAT (lib/StatLogo).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  applicationName: "STAT",
  title: "STAT — Emergência em 10",
  description:
    "STAT: teleconsultoria de sala vermelha. Fotografe o ECG/monitor e receba análise por IA fundamentada em diretrizes e resposta de plantonistas em até 10 minutos.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  appleWebApp: {
    capable: true,
    title: "STAT",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#15294C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Aplica o tema antes do paint (evita flash). Default = claro; escolha em localStorage.
const themeInit = `(function(){try{var t=localStorage.getItem('stat_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${mulish.variable} ${archivo.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Splash />
        {children}
        <SwRegister />
        <Toaster
          position="top-center"
          theme="light"
          richColors
          duration={3500}
          toastOptions={{ style: { fontFamily: "var(--font-mulish)" } }}
        />
      </body>
    </html>
  );
}
