import { isValidDate } from '../../shared/lib/dates';

/** 들었던 수업 하나: 수업명 - 기관 - 기간 */
export interface CourseHistory {
  id: string;
  name: string;
  org: string;
  start: string; // 'YYYY-MM-DD' 또는 ''
  end: string;
}

/** 학력 하나 */
export interface Education {
  id: string;
  school: string;
  major: string;
  degree: string; // EDU_DEGREES 중 하나
  status: string; // EDU_STATUSES 중 하나
  start: string; // 'YYYY-MM' 또는 ''
  end: string;
}

/** 내 정보. 비밀번호는 여기에 저장하지 않는다 (Firebase 로그인이 따로 안전하게 보관) */
export interface Profile {
  nickname: string;
  photo: string; // 작게 줄인 JPEG data URL, 없으면 ''
  courses: CourseHistory[];
  education: Education[];
  updatedAt: string;
}

export type ProfileInput = Partial<Omit<Profile, 'updatedAt'>>;

export const EDU_DEGREES: readonly string[] = ['고등학교', '전문학사', '학사', '석사', '박사', '기타'];
export const EDU_STATUSES: readonly string[] = ['졸업', '재학', '휴학', '수료', '중퇴', '졸업 예정'];

export const PHOTO_MAX_CHARS = 300_000;

export const emptyProfile = (): Profile => ({ nickname: '', photo: '', courses: [], education: [], updatedAt: '' });

export const newRowId = (): string => Math.random().toString(36).slice(2, 10);

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.slice(0, max) : '');
const rows = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((o): o is Record<string, unknown> => !!o && typeof o === 'object' && !Array.isArray(o)).slice(0, 50) : [];
const isMonth = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}$/.test(s);

/** 저장소에서 읽은 값을 하나씩 확인해서 Profile로 만든다 */
export function normalizeProfile(raw: Record<string, unknown> | undefined): Profile {
  if (!raw) return emptyProfile();
  const photo = str(raw.photo, PHOTO_MAX_CHARS);
  return {
    nickname: str(raw.nickname, 40),
    photo: photo.startsWith('data:image/') ? photo : '',
    courses: rows(raw.courses).map((o) => ({
      id: str(o.id, 20) || newRowId(),
      name: str(o.name),
      org: str(o.org),
      start: isValidDate(o.start) ? o.start : '',
      end: isValidDate(o.end) ? o.end : '',
    })),
    education: rows(raw.education).map((o) => ({
      id: str(o.id, 20) || newRowId(),
      school: str(o.school),
      major: str(o.major),
      degree: EDU_DEGREES.includes(str(o.degree)) ? str(o.degree) : '',
      status: EDU_STATUSES.includes(str(o.status)) ? str(o.status) : '',
      start: isMonth(o.start) ? o.start : '',
      end: isMonth(o.end) ? o.end : '',
    })),
    updatedAt: str(raw.updatedAt),
  };
}
