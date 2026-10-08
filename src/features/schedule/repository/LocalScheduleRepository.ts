import { STORAGE_KEYS } from '../../../shared/lib/constants';
import { normalizeSchedule, type Schedule, type ScheduleInput } from '../types';
import type { ScheduleRepository } from './ScheduleRepository';

/** 브라우저(localStorage) 구현체. Firebase 설정 전 연습용 */
export class LocalScheduleRepository implements ScheduleRepository {
  private listeners = new Set<(schedules: Schedule[]) => void>();

  private read(): Record<string, Schedule> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localSchedules);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      const out: Record<string, Schedule> = {};
      for (const [id, body] of Object.entries(parsed)) out[id] = normalizeSchedule(id, body);
      return out;
    } catch {
      return {};
    }
  }

  private write(map: Record<string, Schedule>): void {
    localStorage.setItem(STORAGE_KEYS.localSchedules, JSON.stringify(map));
    const list = Object.values(map);
    this.listeners.forEach((fn) => fn(list));
  }

  subscribe(onChange: (schedules: Schedule[]) => void, onError: (err: Error) => void): () => void {
    this.listeners.add(onChange);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEYS.localSchedules) onChange(Object.values(this.read()));
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

  async create(id: string, input: ScheduleInput): Promise<void> {
    const map = this.read();
    map[id] = { ...input, id, done: false, createdAt: new Date().toISOString() };
    this.write(map);
  }

  async setDone(id: string, done: boolean): Promise<void> {
    const map = this.read();
    if (!map[id]) return;
    map[id] = { ...map[id], done };
    this.write(map);
  }

  async remove(id: string): Promise<void> {
    const map = this.read();
    delete map[id];
    this.write(map);
  }

  async importSchedules(schedules: Schedule[]): Promise<void> {
    const map = this.read();
    for (const s of schedules) map[s.id] = s;
    this.write(map);
  }
}
