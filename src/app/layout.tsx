import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mapping Tool - 人才地图管理",
  description: "人力资源招聘Mapping工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
