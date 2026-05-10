import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "Agendia - SYSCO",
  description: "Sistema de gestión de citas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={GeistSans.className} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
