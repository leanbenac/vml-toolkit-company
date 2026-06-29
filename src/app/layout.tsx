import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar/Navbar";
import { PasswordGate } from "@/components/PasswordGate/PasswordGate";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VML Tools | Hub Interno",
  description: "Simplifica tu trabajo con estas herramientas y aporta tus tools al team.",
  keywords: ["VML", "Tools", "Automation", "Scripts", "Extensiones", "Hub"],
  authors: [{ name: "Automation Squad" }],
  openGraph: {
    title: "VML Tools Hub 🚀",
    description: "Repositorio interno de scripts, extensiones y utilidades para el equipo de VML. Desarrollado por Automation Squad.",
    siteName: "VML Tools",
    type: "website",
    locale: "es_ES",
    images: [
      {
        url: "/og-image.jpg", // Next.js buscará esta imagen en la carpeta public/
        width: 1200,
        height: 630,
        alt: "VML Tools Hub - Vista Previa",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "VML Tools Hub 🚀",
    description: "Repositorio interno de scripts, extensiones y utilidades para el equipo de VML.",
    images: ["/og-image.jpg"],
  },
  themeColor: "#0f111a",
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
