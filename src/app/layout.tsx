import { SessionProvider } from "@/contexts/SessionContext";
import type { Metadata } from "next";
import { JetBrains_Mono, Lora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fontSans = Lora({
  variable: "--font-var-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-var-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ask Ah Mah",
  description: "Your friendly cooking assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`p-2 md:p-4 lg:p-8 ${fontSans.variable} ${fontMono.variable} antialiased font-sans h-[100dvh] `}
      >
        <SessionProvider>
          <Toaster position="top-center" />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
