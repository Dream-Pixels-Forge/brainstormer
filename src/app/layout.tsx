import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brainstormer — AI-Powered Brainstorming Widget",
  description: "Desktop widget for AI-powered brainstorming. Generate ideas, explore concepts, and export your creativity in any format. Built with Tauri.",
  keywords: ["Brainstormer", "AI", "brainstorming", "Tauri", "Desktop Widget", "TypeScript"],
  authors: [{ name: "Brainstormer Team" }],
  icons: {
    icon: "/brainstormer-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-transparent text-foreground overflow-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
