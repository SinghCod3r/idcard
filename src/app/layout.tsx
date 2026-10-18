import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import NextTopLoader from "nextjs-toploader";
import { PWAProvider } from "@/components/pwa/pwa-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ID Card Manager",
  description: "Student ID Card Management Platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ID Cards",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  window.__deferredPrompt = null;
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    window.__deferredPrompt = e;
                    console.log('[PWA] beforeinstallprompt fired early in head');
                    console.log('[PWA] install prompt available:', true);
                    window.dispatchEvent(new Event('pwa-prompt-ready'));
                  });
                  window.addEventListener('appinstalled', function() {
                    window.__deferredPrompt = null;
                    console.log('[PWA] appinstalled fired');
                    window.dispatchEvent(new Event('pwa-installed'));
                  });
                  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then(function(reg) {
                        console.log('[PWA] SW registered in head, scope:', reg.scope);
                      })
                      .catch(function(err) {
                        console.warn('[PWA] SW registration in head failed:', err);
                      });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased h-full flex flex-col`}>
        <PWAProvider>
          <NextTopLoader color="#3b82f6" showSpinner={false} />
          {children}
          <Toaster />
        </PWAProvider>
      </body>
    </html>
  );
}
