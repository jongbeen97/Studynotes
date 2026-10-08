import { STORAGE_KEYS } from '../../../shared/lib/constants';
import { normalizeProfile, type Profile, type ProfileInput } from '../types';
import type { ProfileRepository } from './ProfileRepository';

/** 브라우저(localStorage) 구현체. Firebase 설정 전 연습용 */
export class LocalProfileRepository implements ProfileRepository {
  private listeners = new Set<(profile: Profile) => void>();

  private read(): Profile {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localProfile);
      return normalizeProfile(raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined);
    } catch {
      return normalizeProfile(undefined);
    }
  }

  subscribe(onChange: (profile: Profile) => void, onError: (err: Error) => void): () => void {
    this.listeners.add(onChange);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEYS.localProfile) onChange(this.read());
    };
    window.addEventListener('storage', onStorage);
    try {
      queueMicrotask(() => onChange(this.read()));
    } catch (err) {
      onError(err as Error);
    }
    return () => {
      this.listeners.delete(onChange);
      window.removeEventListener('storage', onStorage);
    };
  }

  async update(input: ProfileInput): Promise<void> {
    const next: Profile = { ...this.read(), ...input, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.localProfile, JSON.stringify(next));
    this.listeners.forEach((fn) => fn(next));
  }
}
