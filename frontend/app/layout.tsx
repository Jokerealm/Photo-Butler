import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import ToastProvider from "../components/Toast";
import MainLayout from "../components/MainLayout";

export const metadata: Metadata = {
  title: "Photo Butler - AI图片生成",
  description: "基于豆包API的AI图片生成应用",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Preload critical resources */}
        {/* <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /> */}
        <link rel="preconnect" href="http://localhost:3001" />
        <link rel="dns-prefetch" href="http://localhost:3001" />
        
        {/* Preload critical CSS */}
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
        
        {/* Performance hints */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body suppressHydrationWarning={true}>
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <ToastProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
