import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechWeb - Your Source for Tech News",
  description:
    "Stay updated with the latest technology news, startups, and innovations.",
  keywords:
    "tech news, technology, startups, AI, web development, cybersecurity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-white dark:bg-surface-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Header />
            <div className="flex-grow w-full py-6">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
            <footer className="border-t border-gray-200 dark:border-white/10 py-4">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500 dark:text-white/60">
                  © 2024 TechWeb. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
