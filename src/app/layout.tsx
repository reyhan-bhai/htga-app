import InstallPrompt from "@/components/InstallPrompt";
import PushNotificationsProvider from "@/components/notifications/PushNotificationsProvider";
import { AuthProvider } from "@/context/AuthContext";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "HTGA - HalalTrip Gastronomy Award",
  description: "Evaluator App for HalalTrip Gastronomy Award",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HTGA",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ... other meta tags ... */}

        {/* Add iOS icon links */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <PushNotificationsProvider>
          <AuthProvider>
            {children}
            <InstallPrompt />
          </AuthProvider>
        </PushNotificationsProvider>
      </body>
    </html>
  );
}
