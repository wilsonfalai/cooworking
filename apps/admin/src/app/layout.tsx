import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cooworking Admin",
  description: "Painel de administração da plataforma",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
