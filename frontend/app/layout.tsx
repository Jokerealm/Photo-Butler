import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import ToastProvider from "../components/Toast";

export const metadata: Metadata = {
  title: "Photo Butler - AI图片生成",
  description: "基于豆包API的AI图片生成应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
