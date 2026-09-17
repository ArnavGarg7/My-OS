import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@myos/shared/constants";
import { Providers } from "./providers";

/**
 * Kinetic Obsidian type engine (V2 Stage 1; V2 aesthetic pass): Sora carries the
 * display + heading scale (greetings, page titles, section heads, big numbers) for
 * a designed, premium feel; Inter remains the dense-UI workhorse for body/interaction;
 * JetBrains Mono carries machine state (timers, shortcuts, telemetry). All three are
 * self-hosted by next/font and exposed as CSS vars @myos/ui's font tokens consume.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0d0e",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
