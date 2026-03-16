import type { Metadata, Viewport } from "next";
import {
  Londrina_Solid,
  Balsamiq_Sans,
  Kalam,
  Oswald,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const londrina = Londrina_Solid({
  weight: ["400", "900"],
  subsets: ["latin"],
  variable: "--font-display",
});

const balsamiq = Balsamiq_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

const kalam = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-hand",
});

const oswald = Oswald({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-condensed",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "SUS — Jogo de Deduzir",
  description: "Um jogo social de dedução online para jogar com a galera! Descubra quem é o impostor.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SUS",
  },
  openGraph: {
    title: "SUS — Jogo de Deduzir",
    description: "Um jogo social de dedução para jogar com os amigos.",
    siteName: "SUS",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${londrina.variable} ${balsamiq.variable} ${kalam.variable} ${oswald.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
