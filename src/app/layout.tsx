import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Kiosco Digital",
  description: "Kiosco para Minimarket Patitas",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
