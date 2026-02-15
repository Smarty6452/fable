import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import PageTransitionProvider from "@/components/PageTransition";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fable - Your Story Speech Buddy",
  description: "Transform speech therapy into a fun AI-powered adventure with Fable. Free, accessible pronunciation practice for children aged 3-8, powered by Smallest AI.",
  keywords: ["speech therapy", "kids", "AI", "pronunciation", "TTS", "Smallest AI", "Fable"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: "font-bold",
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
