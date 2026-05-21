import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// ClerkProvider import karein
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UGC Studio - AI Video Generator",
  description: "Generate Cinematic & UGC Videos with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ClerkProvider se wrap karein
    <ClerkProvider appearance={{ baseTheme: undefined }}>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
