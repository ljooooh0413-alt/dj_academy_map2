export interface Academy {
  id: string;
  name: string; // ACA_NM
  realmName: string; // REALM_SC_NM (입시.검정.보습, 국제화, 예능, 직업기술 등)
  courseName: string; // LE_CRSE_NM (단과, 종합, 어학, 음악, 미술, 코딩 등)
  roadAddress: string; // FA_RDNMA
  jibunAddress?: string; // FA_LOTNO
  tel: string; // TELNO
  targetGrade?: string; // 학습대상 (초등, 중등, 고등, 성인)
  tuition?: string; // 수강료/교습비
  lat: number;
  lng: number;
  status?: string; // 운영상태 (등록, 운영중)
  ofcdcCode: string; // 시도교육청코드
  ofcdcName: string; // 시도교육청명
  admstZone: string; // 행정구역명 (구/군)
  foundedDate?: string; // 설립일자
}

export type TravelMode = 'pedestrian' | 'car';

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
}

export interface RouteResult {
  mode: TravelMode;
  distance: number; // total meters
  duration: number; // total seconds
  coordinates: [number, number][]; // [lat, lng] array formatted for Leaflet polyline
  steps: RouteStep[];
  source: 'tmap' | 'osrm' | 'fallback';
  startName?: string;
  endName?: string;
  warning?: string;
}

export interface FavoriteItem {
  id: string;
  userId?: string;
  academyId: string;
  academyName: string;
  roadAddress: string;
  realmName: string;
  courseName: string;
  tel: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface RegionOption {
  code: string;
  name: string;
  zones: string[];
  defaultCenter: [number, number]; // [lat, lng]
}
