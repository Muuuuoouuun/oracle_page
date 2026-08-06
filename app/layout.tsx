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
        {/* Ambient background — organic drift, not mechanical pulse */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-60 -left-40 w-[520px] h-[520px] rounded-full bg-oracle-purple/[0.07] blur-[110px] orb-drift" />
          <div className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full bg-oracle-glow/[0.055] blur-[90px] orb-drift-slow" />
          <div className="absolute bottom-20 left-1/4 w-[380px] h-[380px] rounded-full bg-oracle-hot/[0.04] blur-[100px] orb-drift-medium" />
          <div className="absolute top-2/3 left-1/2 w-[320px] h-[320px] rounded-full bg-oracle-violet/[0.05] blur-[75px] orb-drift-alt" />
        </div>
        <div className="relative z-10">
          <AppProvider>{children}</AppProvider>
        </div>
      </body>
    </html>
  );
}
