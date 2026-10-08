import { STORAGE_KEYS } from '../../../shared/lib/constants';
import { normalizeEntry, type Entry, type EntryInput, type ReviewKind } from '../types';
import type { EntryRepository } from './EntryRepository';

/**
 * 브라우저(localStorage) 구현체.
 * Firebase 설정 전 연습용이다. 이 기기·이 브라우저에만 저장되고 다른 기기와 맞춰지지 않는다.
 */
export class LocalEntryRepository implements EntryRepository {
  readonly label = '이 기기에만 저장';
  private listeners = new Set<(entries: Entry[]) => void>();

  private read(): Record<string, Entry> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localEntries);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const out: Record<string, Entry> = {};
      for (const [id, body] of Object.entries(parsed)) out[id] = normalizeEntry(id, body);
      return out;
    } catch {
      return {};
    }
  }

  private write(map: Record<string, Entry>): void {
    localStorage.setItem(STORAGE_KEYS.localEntries, JSON.stringify(map));
    const list = Object.values(map);
    this.listeners.forEach((fn) => fn(list));
  }

  subscribe(onChange: (entries: Entry[]) => void, onError: (err: Error) => void): () => void {
    this.listeners.add(onChange);
    // 다른 탭에서 바뀐 것도 반영
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEYS.localEntries) onChange(Object.values(this.read()));
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

  async create(id: string, input: EntryInput, opts?: { example?: boolean }): Promise<void> {
    const map = this.read();
    const now = new Date().toISOString();
    map[id] = { ...input, id, reviewed: { d1: false, d7: false }, example: opts?.example === true, createdAt: now, updatedAt: now };
    this.write(map);
  }

  async update(id: string, input: EntryInput): Promise<void> {
    const map = this.read();
    const prev = map[id];
    if (!prev) throw new Error('수정할 기록을 찾지 못했어요.');
    map[id] = { ...prev, ...input, example: false, updatedAt: new Date().toISOString() };
    this.write(map);
  }

  async markReviewed(id: string, kind: ReviewKind): Promise<void> {
    const map = this.read();
    const prev = map[id];
    if (!prev) return;
    map[id] = { ...prev, reviewed: { ...prev.reviewed, [kind]: true } };
    this.write(map);
  }

  async remove(id: string): Promise<void> {
    const map = this.read();
    delete map[id];
    this.write(map);
  }

  async importEntries(entries: Entry[]): Promise<void> {
    const map = this.read();
    for (const e of entries) map[e.id] = e;
    this.write(map);
  }
}
