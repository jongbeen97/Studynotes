import { WEEKDAYS } from './constants';

/*
 * 날짜는 'YYYY-MM-DD' 문자열로 저장하고, 계산할 때만 "1970-01-01부터 며칠째인지"(day number)로 바꾼다.
 * Date 객체의 시간대(한국 UTC+9) 때문에 하루가 밀리는 실수를 막기 위한 방법이다.
 */

export const pad = (n: number): string => String(n).padStart(2, '0');

/** 기기의 현지 날짜(한국이면 한국 날짜)를 'YYYY-MM-DD'로 */
export function localDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** 'YYYY-MM-DD' → 날짜 번호(정수). 두 날짜의 차이 = 날짜 번호의 차이 */
export function dayNumber(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function fromDayNumber(n: number): string {
  const d = new Date(n * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 0 = 일요일 … 6 = 토요일 */
export function weekdayOf(s: string): number {
  return new Date(dayNumber(s) * 86_400_000).getUTCDay();
}

/** '10.08 (목)' */
export function formatShort(s: string): string {
  const [, m, d] = s.split('-');
  return `${Number(m)}.${d} (${WEEKDAYS[weekdayOf(s)]})`;
}

/** '2026.10.08 (목)' */
export function formatLong(s: string): string {
  const [y, m, d] = s.split('-');
  return `${y}.${m}.${d} (${WEEKDAYS[weekdayOf(s)]})`;
}
