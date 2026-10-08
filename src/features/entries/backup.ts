import { isValidDate } from '../../shared/lib/dates';
import { newNoticeId, normalizeNotice, type Notice } from '../notices/types';
import { newScheduleId, normalizeSchedule, type Schedule } from '../schedule/types';
import { newEntryId } from './repository/EntryRepository';
import { normalizeEntry, type Entry } from './types';

const SAFE_ID = /^(?!\.\.?$)(?!__.*__$)[A-Za-z0-9_\-.~:@+]{1,200}$/;

export interface Backup {
  entries: Entry[];
  schedules: Schedule[];
  notices: Notice[];
}

/** 전체 기록·일정·공지를 JSON 파일로 내려받기 (기기를 바꾸거나 서비스를 옮길 때 쓰는 백업) */
export function downloadBackup({ entries, schedules, notices }: Backup, today: string): void {
  const data = { app: 'sesac-log', version: 3, exportedAt: new Date().toISOString(), entries, schedules, notices };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dev-log-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const objects = (list: unknown): Record<string, unknown>[] =>
  Array.isArray(list) ? list.filter((o): o is Record<string, unknown> => !!o && typeof o === 'object' && !Array.isArray(o)) : [];

const safeId = (o: Record<string, unknown>, make: (date: string) => string): string =>
  typeof o.id === 'string' && SAFE_ID.test(o.id) ? o.id : make(isValidDate(o.date) ? o.date : 'imported');

/** 백업 파일 내용을 읽어 기록·일정·공지 목록으로. 형식이 맞지 않으면 null (예전 버전 백업은 없는 항목을 빈 목록으로 읽는다) */
export function parseBackup(text: string): Backup | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const root = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  const list: unknown = Array.isArray(parsed) ? parsed : root?.entries;
  if (!Array.isArray(list)) return null;
  return {
    entries: objects(list).map((o) => normalizeEntry(safeId(o, newEntryId), o)),
    schedules: objects(root?.schedules).map((o) => normalizeSchedule(safeId(o, newScheduleId), o)),
    notices: objects(root?.notices).map((o) => normalizeNotice(safeId(o, newNoticeId), o)),
  };
}
