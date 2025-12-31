import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
