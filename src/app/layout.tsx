import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Weave from "@/components/Weave";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], style: ["italic", "normal"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Fuguaa — Three generations of craft",
  description: "Buy authentic Ghanaian smocks directly from independent makers.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Weave />
        <footer className="px-6 py-8 text-center text-sm text-charcoal/70">
          <p className="font-serif italic">Three generations of craft</p>
          <p className="mt-1">© {new Date().getFullYear()} Fuguaa</p>
        </footer>
      </body>
    </html>
  );
}
