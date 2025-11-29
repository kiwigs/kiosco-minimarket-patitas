import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kiosco Minimarket Patitas",
  description: "Kiosco digital para el Minimarket Patitas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
