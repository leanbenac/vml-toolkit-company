import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar/Navbar";
import { PasswordGate } from "@/components/PasswordGate/PasswordGate";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VML Tools | Hub Interno",
  description: "Simplifica tu trabajo con estas herramientas y aporta tus tools al team.",
  openGraph: {
    title: "VML Tools Hub 🚀",
    description: "Repositorio interno de scripts, extensiones y utilidades para el equipo de VML.",
    siteName: "VML Tools",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <div className="grid-overlay" />
        <PasswordGate>
          <Navbar />
          <main className="main-container">
            {children}
          </main>
        </PasswordGate>
        <Analytics />
      </body>
    </html>
  );
}
