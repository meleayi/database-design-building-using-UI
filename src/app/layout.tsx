import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Database Structure Builder",
  description: "Build and publish database structures to SQL Server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-serif">{children}</body>
    </html>
  );
}
