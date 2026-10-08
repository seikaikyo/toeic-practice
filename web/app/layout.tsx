import type { Metadata, Viewport } from "next";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "多益練習",
  description: "多益閱讀刷題、模擬考、背單字與作答統計",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant-TW"
      // 瀏覽器自動翻譯會改寫文字節點，React 卸載時 removeChild 找不到原節點而崩潰（TOEIC-PRACTICE-4）；
      // 題目本身是英文，被翻掉也失去練習意義
      translate="no"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
