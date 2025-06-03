import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Password Generator",
  description: "Genera contraseñas seguras y personalizadas",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:%234f46e5;stop-opacity:1' /><stop offset='100%25' style='stop-color:%237c3aed;stop-opacity:1' /></linearGradient></defs><rect width='100' height='100' rx='20' fill='url(%23grad)'/><path d='M30 35h40v6H30zm0 12h25v6H30zm0 12h35v6H30z' fill='white' opacity='0.9'/><circle cx='75' cy='35' r='3' fill='white' opacity='0.7'/><circle cx='75' cy='47' r='3' fill='white' opacity='0.7'/><circle cx='75' cy='59' r='3' fill='white' opacity='0.7'/></svg>",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:%234f46e5;stop-opacity:1' /><stop offset='100%25' style='stop-color:%237c3aed;stop-opacity:1' /></linearGradient></defs><rect width='180' height='180' rx='40' fill='url(%23grad)'/><path d='M54 63h72v11H54zm0 22h45v11H54zm0 22h63v11H54z' fill='white' opacity='0.9'/><circle cx='135' cy='63' r='5' fill='white' opacity='0.7'/><circle cx='135' cy='85' r='5' fill='white' opacity='0.7'/><circle cx='135' cy='107' r='5' fill='white' opacity='0.7'/></svg>",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
