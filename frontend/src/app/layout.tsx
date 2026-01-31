import type { Metadata } from 'next';
import { Noto_Sans_KR, Gowun_Dodum, Gowun_Batang, Playfair_Display } from 'next/font/google';
import { QueryProvider } from '@/lib/providers/query-provider';
import './globals.css';

// 본문용 - 깔끔하고 가독성 좋음
const notoSansKR = Noto_Sans_KR({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// 로고용 - 부드럽고 친근한 느낌
const gowunDodum = Gowun_Dodum({
  variable: '--font-logo',
  subsets: ['latin'],
  weight: ['400'],
});

// 한글 포인트용 - 고급스러운 세리프
const gowunBatang = Gowun_Batang({
  variable: '--font-serif-kr',
  subsets: ['latin'],
  weight: ['400', '700'],
});

// 영문 포인트용 - 클래식 세리프
const playfairDisplay = Playfair_Display({
  variable: '--font-serif-en',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'VoiceUp - AI 발화 코칭',
  description: 'AI가 당신의 말을 더 명확하고 자신감 있게 다듬어드립니다',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKR.variable} ${gowunDodum.variable} ${gowunBatang.variable} ${playfairDisplay.variable} antialiased`}
        style={{ fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
