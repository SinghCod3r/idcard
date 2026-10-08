import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ID Card Manager",
  description: "Student ID Card Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased h-full flex flex-col`}>
        <NextTopLoader color="#3b82f6" showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
