import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Literata } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Garuda — AI Interviewer",
  description: "Private, resume-aware interview practice that runs locally.",
  applicationName: "Garuda",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Garuda",
    statusBarStyle: "default",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <PwaRegister />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
