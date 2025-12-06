import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Control de Proyectos",
  description: "Gestión y control presupuestario de proyectos",
};

import { RoleProvider } from "@/context/RoleContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex h-screen bg-slate-50`}>
        <AuthProvider>
          <RoleProvider>
            <div className="flex h-full w-full">
              <ClientLayout>{children}</ClientLayout>
            </div>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
