import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

// high-contrast editorial serif for the flower titles
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Neon Bloom",
  description: "A scroll-driven 3D flower collection.",
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  // draw under the notch / home indicator; the UI pads itself with safe-area insets
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${cormorant.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
