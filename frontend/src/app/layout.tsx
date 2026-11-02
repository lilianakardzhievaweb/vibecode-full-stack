import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

// cyrillic - за да се показва правилно българският текст
const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin", "cyrillic"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "AI Tools Hub",
  description: "Вътрешна платформа за споделяне на AI инструменти в екипа",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body className={`${interSans.variable} ${jetBrainsMono.variable} min-h-screen antialiased`}>
        <UserProvider>
          <ToastProvider>
            <Header />
            <div id="main">{children}</div>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
