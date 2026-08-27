import type { Metadata } from "next";
import { AppProvider } from "@/lib/context";
import GradeUpOverlay from "@/components/GradeUpOverlay";
import ErrorToast from "@/components/ErrorToast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oracle Page | 당신은 예언가입니까?",
  description: "커뮤니티 예언 플랫폼 - 예측하고, 배팅하고, 예언왕이 되어라!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-oracle-dark">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-oracle-purple/10 blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-oracle-glow/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-oracle-hot/5 blur-3xl" />
        </div>
        <div className="relative z-10">
          <AppProvider>
            {children}
            {/* 승급 연출과 실패 안내는 어느 화면에서든 떠야 한다 */}
            <GradeUpOverlay />
            <ErrorToast />
          </AppProvider>
        </div>
      </body>
    </html>
  );
}
