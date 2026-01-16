import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calavera - Liar's Dice",
  description: "A Balatro-inspired retro Liar's Dice game with skulls and style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bg-dark">
        {children}
        {/* CRT Scanlines Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.08) 0px,
              rgba(0, 0, 0, 0.08) 1px,
              transparent 1px,
              transparent 3px
            )`,
          }}
        />
        {/* Vignette */}
        <div
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{
            background: `radial-gradient(
              ellipse at center,
              transparent 0%,
              transparent 60%,
              rgba(0, 0, 0, 0.4) 100%
            )`,
          }}
        />
      </body>
    </html>
  );
}
