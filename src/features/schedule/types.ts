import { isValidDate } from '../../shared/lib/dates';

/** 사용자가 입력하는 일정 (Spring으로 치면 요청 DTO) */
export interface ScheduleInput {
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM', 시간 없는 일정은 ''
  title: string;
}

/** 저장된 일정 하나 (Spring으로 치면 엔티티) */
export interface Schedule extends ScheduleInput {
  id: string;
  done: boolean;
  createdAt: string; // ISO 시각
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const isValidTime = (s: unknown): s is string => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** 저장소나 백업 파일에서 읽은 값은 하나씩 확인해서 Schedule로 만든다 */
export function normalizeSchedule(id: string, raw: Record<string, unknown>): Schedule {
  return {
    id,
    date: isValidDate(raw.date) ? raw.date : '1970-01-01',
    time: isValidTime(raw.time) ? raw.time : '',
    title: str(raw.title).slice(0, 100),
    done: raw.done === true,
    createdAt: str(raw.createdAt) || new Date(0).toISOString(),
  };
}

/** 날짜 → 시간 순. 시간 없는 일정은 그날 맨 위 */
export function sortSchedules(list: Schedule[]): Schedule[] {
  return [...list].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.time !== b.time ? (a.time < b.time ? -1 : 1) : a.createdAt.localeCompare(b.createdAt),
  );
}

/** 새 일정의 id: 날짜 + 무작위 6글자 */
export function newScheduleId(date: string): string {
  return `${date}-${Math.random().toString(36).slice(2, 8)}`;
}
