/** 앱 이름 (헤더·로그인 화면·브라우저 탭에 쓰인다) */
export const APP_NAME = '개발일지';

/** 과정 일정 — 날짜는 모두 'YYYY-MM-DD' 문자열로 다룬다. */
export const COURSE = {
  start: '2026-05-18',
  end: '2026-11-20',
  gokgan: '2026-10-12', // 곳간 프로젝트 시작일
} as const;

/** 일지 분야. topics가 있으면 쓰기 화면에서 세부 항목을 고를 수 있다. */
export interface Category {
  name: string;
  topics: readonly string[];
}

export const CATEGORIES: readonly Category[] = [
  { name: '언어', topics: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'Go', 'Terraform'] },
  { name: '프론트엔드', topics: ['JavaScript', 'TypeScript', 'React'] },
  { name: '백엔드', topics: ['Spring', 'Spring Boot'] },
  { name: 'LLM · AI', topics: [] },
  { name: 'OS', topics: ['Linux', 'Mac', 'Windows'] },
  { name: 'Infra', topics: ['Linux Ubuntu', 'Network'] },
  { name: 'AWS', topics: [] },
  { name: 'Docker', topics: [] },
  { name: 'Kubernetes', topics: [] },
  { name: 'MSA', topics: [] },
  { name: 'Spring Cloud', topics: [] },
  { name: 'AWS 고급기술', topics: [] },
  { name: '기타', topics: [] },
];

export const SUBJECTS: readonly string[] = CATEGORIES.map((c) => c.name);

export const topicsOf = (subject: string): readonly string[] => CATEGORIES.find((c) => c.name === subject)?.topics ?? [];

/** 예전 과목 이름 → 새 분야(·세부 항목). 예전에 쓴 일지를 읽을 때 자동으로 옮긴다. */
export const LEGACY_SUBJECTS: Record<string, { subject: string; topic: string }> = {
  리눅스: { subject: 'Infra', topic: 'Linux Ubuntu' },
  네트워크: { subject: 'Infra', topic: 'Network' },
  'MSA · Spring Cloud': { subject: 'MSA', topic: '' },
  EKS: { subject: 'AWS 고급기술', topic: '' },
  'AWS SDK': { subject: 'AWS 고급기술', topic: '' },
  서버리스: { subject: 'AWS 고급기술', topic: '' },
  'Bedrock · AI': { subject: 'LLM · AI', topic: '' },
  '곳간 프로젝트': { subject: '기타', topic: '' },
};

/** 로드맵 문서 "개념 연결 지도"의 13칸 */
export const MAP_ROWS: readonly string[] = [
  '실행 단위',
  '실행 설계도',
  '여러 개 묶어 띄우기',
  '주소·포트',
  '외부 요청 입구',
  '이름으로 찾기',
  '트래픽 막기',
  '데이터 보관',
  '설정·비밀값',
  '권한',
  '살아 있나 확인',
  '자동으로 늘리기',
  '로그·지표',
];

export const LEVELS: readonly string[] = [
  '거의 모름',
  '단어만 앎',
  '따라 할 수 있음',
  '설명할 수 있음',
  '남에게 가르칠 수 있음',
];

export const WEEKDAYS: readonly string[] = ['일', '월', '화', '수', '목', '금', '토'];

export const STORAGE_KEYS = {
  draft: 'sesac-log:draft',
  localEntries: 'sesac-log:entries',
  localSchedules: 'sesac-log:schedules',
  localProfile: 'sesac-log:profile',
  localNotices: 'sesac-log:notices',
  installHintDismissed: 'sesac-log:install-hint-dismissed',
} as const;
