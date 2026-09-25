import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const vazirmatn = Vazirmatn({ variable: "--font-vazirmatn", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "YFG AI Software Factory",
  description: "کارخانه‌ی مهندسی نرم‌افزار مبتنی بر هوش مصنوعی — تحت حاکمیت انسان",
  icons: { icon: "/yfg-logo.png" },
};

const themeScript = `(function(){try{var t=localStorage.getItem('yfg-theme')||'corporate';document.documentElement.setAttribute('data-theme',t);if(t!=='dark-pro')document.documentElement.classList.add('dark');}catch(e){document.documentElement.setAttribute('data-theme','corporate');document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} font-vazirmatn antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
