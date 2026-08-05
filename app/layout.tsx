import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { AppProvider } from "@/lib/context";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Oracle Page | 당신은 예언가입니까?",
  description: "커뮤니티 예언 플랫폼 - 예측하고, 배팅하고, 예언왕이 되어라!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className="min-h-screen bg-oracle-dark antialiased">
        {/* Ambient background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-60 -left-40 w-[500px] h-[500px] rounded-full bg-oracle-purple/8 blur-[100px] animate-pulse-slow" />
          <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-oracle-glow/6 blur-[80px] animate-pulse-slow [animation-delay:1.5s]" />
          <div className="absolute bottom-10 left-1/4 w-[350px] h-[350px] rounded-full bg-oracle-hot/4 blur-[90px] animate-pulse-slow [animation-delay:3s]" />
          <div className="absolute top-2/3 left-1/2 w-[300px] h-[300px] rounded-full bg-oracle-violet/5 blur-[70px] animate-pulse-slow [animation-delay:2s]" />
        </div>
        <div className="relative z-10">
          <AppProvider>{children}</AppProvider>
        </div>
      </body>
    </html>
  );
}
