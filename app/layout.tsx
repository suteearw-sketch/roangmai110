import type { Metadata } from "next";
import "./globals.css";
import "./command-center.css";

export const metadata: Metadata = {
  title: "โรงไม้110 · ศูนย์บัญชาการ",
  description: "พื้นที่ทำงานของBOSSและทีม AI เพื่อพัฒนาโรงไม้110 ไปพร้อมกับผู้เช่าทุกร้าน",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
