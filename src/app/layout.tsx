import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ride Shift RVA",
  description: "Move green, save green. Earn local rewards for car-free commuting in Richmond, VA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex-1">{children}</div>
          <footer className="px-4 py-8 text-center border-t border-zinc-100">
            <p className="font-semibold text-zinc-700">
              Built at the Richmond Civic Hackathon
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              A real solution for real Richmonders — no car required.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
