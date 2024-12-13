import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoGradePro",
  description: "An Automated Paper Grading System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="">
        <main className="relative  bg-purple-100 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
