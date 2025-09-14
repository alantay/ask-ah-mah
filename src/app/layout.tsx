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
  metadataBase: new URL("https://ask-ah-mah.vercel.app"), // Replace with your actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ask Ah Mah - Your Friendly Cooking Assistant",
    description:
      "Discover delicious recipes with Ask Ah Mah! Get personalized cooking suggestions based on your available ingredients.",
    url: "https://ask-ah-mah.vercel.app", // Replace with your actual domain
    siteName: "Ask Ah Mah",
    images: [
      {
        url: "/og-image.png", // You'll need to create this
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
    images: ["/og-image.png"], // You'll need to create this
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
  verification: {
    google: "your-google-verification-code", // Add when you have it
  },
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
