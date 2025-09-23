import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/contexts/SessionContext";
import type { Metadata } from "next";
import { JetBrains_Mono, Merriweather } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const fontSans = Merriweather({
  variable: "--font-var-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-var-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ask Ah Mah - Your Friendly Cooking Assistant",
    template: "%s | Ask Ah Mah",
  },
  description:
    "Discover delicious recipes with Ask Ah Mah! Get personalized cooking suggestions based on your available ingredients. Perfect for cooking beginners and food enthusiasts.",
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
    title: "Ask Ah Mah - Your Friendly Cooking Assistant",
    description:
      "Discover delicious recipes with Ask Ah Mah! Get personalized cooking suggestions based on your available ingredients.",
    url: "https://ask-ah-mah.vercel.app",
    siteName: "Ask Ah Mah",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ask Ah Mah - Cooking Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ask Ah Mah - Your Friendly Cooking Assistant",
    description:
      "Discover delicious recipes with Ask Ah Mah! Get personalized cooking suggestions based on your available ingredients.",
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
        className={`mx-0 mt-0 sm:mx-2 sm:mt-2 md:mx-4 md:mt-4 ${fontSans.variable} ${fontMono.variable} antialiased font-sans
`}
      >
        <SessionProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                color: "#6F502D",
              },
            }}
          />
          <div className="pb-2 sm:pb-4 pt-2 border-b xl:container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <div className="relative w-10 h-10 md:w-12 md:h-12">
                <Image
                  src="/granny-icon.png"
                  alt="Ask Ah Mah"
                  fill
                  className="object-contain"
                />
              </div>
              Ask Ah Mah
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm lg:text-base">
              Your friendly cooking assistant
            </p>
          </div>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
