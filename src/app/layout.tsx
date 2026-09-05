import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J.A Services -- Importation, Masterclass & Products",
  description:
    "Source products through our platform, learn the trade with our Masterclass, or shop what's already on ground.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
