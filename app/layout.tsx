import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { SocketProvider } from "@/lib/SocketContext";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/providers/QueryProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CarBlink Dashboard — Operations & Customer Portal",
  description: "Official CarBlink Dashboard for Operations, Management, Partners, and Customers",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/car_blink.jpg", type: "image/jpeg" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable, inter.variable, "font-sans")}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster position="top-right" />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
