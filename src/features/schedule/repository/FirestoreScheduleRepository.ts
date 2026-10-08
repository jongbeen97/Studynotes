import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { normalizeSchedule, type Schedule, type ScheduleInput } from '../types';
import type { ScheduleRepository } from './ScheduleRepository';

/**
 * Firestore 구현체.
 * 저장 위치: users/{로그인한 사람의 uid}/schedules/{일정 id}
 */
export class FirestoreScheduleRepository implements ScheduleRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db = db;
    this.uid = uid;
  }

  private col() {
    return collection(this.db, 'users', this.uid, 'schedules');
  }

  subscribe(onChange: (schedules: Schedule[]) => void, onError: (err: Error) => void): () => void {
    return onSnapshot(
      this.col(),
      (snap) => onChange(snap.docs.map((d) => normalizeSchedule(d.id, d.data()))),
      (err) => onError(err),
    );
  }

  async create(id: string, input: ScheduleInput): Promise<void> {
    await setDoc(doc(this.col(), id), { ...input, done: false, createdAt: new Date().toISOString() });
  }

  async setDone(id: string, done: boolean): Promise<void> {
    await updateDoc(doc(this.col(), id), { done });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id));
  }

  async importSchedules(schedules: Schedule[]): Promise<void> {
    for (let i = 0; i < schedules.length; i += 400) {
      const batch = writeBatch(this.db);
      for (const s of schedules.slice(i, i + 400)) {
        const { id, ...body } = s;
        batch.set(doc(this.col(), id), body);
      }
      await batch.commit();
    }
  }
}
