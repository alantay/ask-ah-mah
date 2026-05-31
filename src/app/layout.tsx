import { AuthButton } from "@/features/Auth";
import { AppSidebar } from "@/features/shared/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { SessionProvider } from "@/contexts/SessionContext";
import type { Metadata } from "next";
import { Fraunces, Inter, Nunito } from "next/font/google";
import Image from "next/image";
import { Suspense } from "react";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-var-sans",
  subsets: ["latin"],
});

const fontDisplay = Fraunces({
  variable: "--font-var-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const fontLogo = Nunito({
  variable: "--font-var-logo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ask Ah Mah — Cook with what you have",
    template: "%s | Ask Ah Mah",
  },
  description:
    "Ah Mah remembers what's in your kitchen and cooks alongside you. No forms, no spreadsheets — just chat.",
  keywords: [
    "cooking assistant",
    "recipe suggestions",
    "cooking for beginners",
    "ingredient-based recipes",
    "meal planning",
    "cooking tips",
    "kitchen inventory",
    "food recipes",
    "cooking help",
    "recipe finder",
  ],

  authors: [{ name: "Alan Tay" }],
  creator: "Alan Tay",
  publisher: "Alan Tay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ask-ah-mah.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ask Ah Mah — Cook with what you have",
    description:
      "Ah Mah remembers what's in your kitchen and cooks alongside you. No forms, no spreadsheets — just chat.",
    url: "https://ask-ah-mah.vercel.app",
    siteName: "Ask Ah Mah",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ask Ah Mah — your kitchen's grandmother",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ask Ah Mah — Cook with what you have",
    description:
      "Ah Mah remembers what's in your kitchen and cooks alongside you. No forms, no spreadsheets — just chat.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // verification: {
  //   google: "google-verification-code",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`mx-0 mt-0 sm:mx-2 sm:mt-2 md:mx-4 md:mt-4 lg:mx-0 lg:mt-0 ${fontSans.variable} ${fontDisplay.variable} ${fontLogo.variable} antialiased font-sans flex h-dvh overflow-hidden`}
      >
        <SessionProvider>
          <ConversationProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  color: "#6F502D",
                },
              }}
            />
            <Suspense fallback={null}>
              <AppSidebar />
            </Suspense>
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Mobile-only top bar */}
              <div className="lg:hidden pb-2 pt-2 border-b px-4 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-display italic tracking-[-0.015em] leading-none flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/granny-icon.png"
                      alt="Ask Ah Mah"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-normal text-ink-faint">Ask </span><span className="font-semibold text-primary">Ah Mah</span>
                </h1>
                <div className="flex items-center gap-2">
                  <AuthButton />
                </div>
              </div>
              {children}
            </div>
          </ConversationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
