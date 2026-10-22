import type { Metadata, Viewport } from "next";
import { Figtree, Karla, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const karla = Karla({ variable: "--font-karla", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MabiList",
  description: "Your practical logbook for customer orders, deliveries, and payments.",
};

export const viewport: Viewport = { themeColor: "#1e3b33" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${karla.variable} ${figtree.variable} antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
