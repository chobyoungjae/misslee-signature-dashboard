import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미쓰리 서명앱",
  description: "미쓰리 서명 대시보드 - 간편한 문서 서명 관리 앱",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/ver2.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/ver2.ico", sizes: "16x16", type: "image/x-icon" }
    ],
    apple: "/ver2.ico"
  },
  openGraph: {
    type: "website",
    title: "미쓰리 서명앱",
    description: "간편한 문서 서명 관리 앱 - 미쓰리 서명 대시보드",
    url: "https://misslee-signature-dashboard.vercel.app",
    siteName: "미쓰리 서명앱",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "미쓰리 서명앱 로고"
      }
    ],
    locale: "ko_KR"
  },
  twitter: {
    card: "summary_large_image",
    title: "미쓰리 서명앱",
    description: "간편한 문서 서명 관리 앱",
    images: ["/og-image.png"]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "미쓰리 서명앱"
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4285f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
