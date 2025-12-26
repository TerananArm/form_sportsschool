import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai, Noto_Sans_SC, Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from './context/LanguageContext';

import AuthProvider from './context/AuthProvider';

import PageTransition from './components/PageTransition';

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-prompt",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-thai",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sc",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-jp",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduSched AI - ระบบบริหารการศึกษา",
  description: "ระบบบริหารจัดการตารางสอนและข้อมูลวิทยาลัย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body id="root-layout" className={`${prompt.variable} ${notoSansThai.variable} ${notoSansSC.variable} ${notoSansJP.variable} ${notoSansKR.variable} font-sans antialiased bg-gray-50 dark:bg-[#050505] text-slate-900 dark:text-slate-100`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>

              <PageTransition>
                {children}
              </PageTransition>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}