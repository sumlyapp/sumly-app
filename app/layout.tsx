import type { Metadata } from "next";
import "./globals.css";  // 🔥 YEH LINE IMPORTANT HAI

export const metadata: Metadata = {
  title: "Summarise",
  description: "Read less, know more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}