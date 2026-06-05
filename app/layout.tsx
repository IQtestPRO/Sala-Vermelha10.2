import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import SwRegister from "@/components/SwRegister";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  applicationName: "Emergência em 10",
  title: "Emergência em 10 — Casos de sala vermelha em até 10 min",
  description:
    "Teleconsultoria de emergência: envie o caso crítico (ECG, vitais, conduta) e receba resposta de plantonistas em até 10 minutos. Condutas de sala vermelha à mão.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  appleWebApp: {
    capable: true,
    title: "Emergência em 10",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${mulish.variable}`}>
      <body>
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
