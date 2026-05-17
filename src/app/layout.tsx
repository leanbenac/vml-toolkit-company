import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar/Navbar";
import { PasswordGate } from "@/components/PasswordGate/PasswordGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "VML Tools | Hub Interno",
  description: "Simplifica tu trabajo con estas herramientas y aporta tus tools al team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="grid-overlay" />
        <PasswordGate>
          <Navbar />
          <main style={{ padding: '0 2rem' }}>
            {children}
          </main>
        </PasswordGate>
      </body>
    </html>
  );
}
