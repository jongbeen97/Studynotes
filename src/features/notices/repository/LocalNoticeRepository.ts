import { STORAGE_KEYS } from '../../../shared/lib/constants';
import { normalizeNotice, type Notice, type NoticeInput } from '../types';
import type { NoticeRepository } from './NoticeRepository';

/** 브라우저(localStorage) 구현체. Firebase 설정 전 연습용 */
export class LocalNoticeRepository implements NoticeRepository {
  private listeners = new Set<(notices: Notice[]) => void>();

  private read(): Record<string, Notice> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localNotices);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const out: Record<string, Notice> = {};
      for (const [id, body] of Object.entries(parsed)) out[id] = normalizeNotice(id, body);
      return out;
    } catch {
      return {};
    }
  }

  private write(map: Record<string, Notice>): void {
    localStorage.setItem(STORAGE_KEYS.localNotices, JSON.stringify(map));
    const list = Object.values(map);
    this.listeners.forEach((fn) => fn(list));
  }

  subscribe(onChange: (notices: Notice[]) => void, onError: (err: Error) => void): () => void {
    this.listeners.add(onChange);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEYS.localNotices) onChange(Object.values(this.read()));
    };
    window.addEventListener('storage', onStorage);
    try {
      queueMicrotask(() => onChange(Object.values(this.read())));
    } catch (err) {
      onError(err as Error);
    }
    return () => {
      this.listeners.delete(onChange);
      window.removeEventListener('storage', onStorage);
    };
  }

  async create(id: string, input: NoticeInput): Promise<void> {
    const map = this.read();
    const now = new Date().toISOString();
    map[id] = { ...input, id, createdAt: now, updatedAt: now };
    this.write(map);
  }

  async update(id: string, input: NoticeInput): Promise<void> {
    const map = this.read();
    if (!map[id]) throw new Error('수정할 공지를 찾지 못했어요.');
    map[id] = { ...map[id], ...input, updatedAt: new Date().toISOString() };
    this.write(map);
  }

  async remove(id: string): Promise<void> {
    const map = this.read();
    delete map[id];
    this.write(map);
  }

  async importNotices(notices: Notice[]): Promise<void> {
    const map = this.read();
    for (const n of notices) map[n.id] = n;
    this.write(map);
  }
}
