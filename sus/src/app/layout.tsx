import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SUS — Social Party Game",
  description: "Find the impostor among your friends!",
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
    >
      <body className="antialiased font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
