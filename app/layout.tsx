import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'EduMap | 전국 학원·교습소 지도 및 실시간 경로 안내',
  description: '나이스(NEIS) 교육정보 기반 전국 학원·교습소 상세 정보 조회, 관심 학원 즐겨찾기 보관 및 정확한 도보/차량 최적 경로 안내 서비스입니다.',
  openGraph: {
    title: 'EduMap | 전국 학원·교습소 지도 및 실시간 경로 안내',
    description: '전국 학원·교습소 검색, 즐겨찾기 동기화 및 TMAP/도보 최적 경로 안내',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduMap | 전국 학원·교습소 지도 및 실시간 경로 안내',
    description: '전국 학원·교습소 검색, 즐겨찾기 동기화 및 TMAP/도보 최적 경로 안내',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
