import type { Metadata } from "next";
import "./globals.css";
import ProtectedRoute from "./_components/ProtectedRoutes";

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
      <body className="bg-purple-100">
        <main className="relative  bg-purple-100 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}

// Root Layout does not need to be wrapped in a protected route, because all the login page and sign-in page are not protected, they need to be in public
