import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { normalizeEntry, type Entry, type EntryInput, type ReviewKind } from '../types';
import type { EntryRepository } from './EntryRepository';

/**
 * Firestore 구현체.
 * 저장 위치: users/{로그인한 사람의 uid}/entries/{기록 id}
 * → firestore.rules 가 "자기 uid 폴더만" 읽고 쓰게 막는다.
 */
export class FirestoreEntryRepository implements EntryRepository {
  readonly label = '클라우드 동기화';
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db = db;
    this.uid = uid;
  }

  private col() {
    return collection(this.db, 'users', this.uid, 'entries');
  }

  subscribe(onChange: (entries: Entry[]) => void, onError: (err: Error) => void): () => void {
    return onSnapshot(
      this.col(),
      (snap) => onChange(snap.docs.map((d) => normalizeEntry(d.id, d.data()))),
      (err) => onError(err),
    );
  }

  async create(id: string, input: EntryInput, opts?: { example?: boolean }): Promise<void> {
    const now = new Date().toISOString();
    await setDoc(doc(this.col(), id), {
      ...input,
      reviewed: { d1: false, d7: false },
      example: opts?.example === true,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, input: EntryInput): Promise<void> {
    // createdAt, reviewed 는 건드리지 않고 입력값만 바꾼다. 수정하면 예시 표시는 없앤다.
    await updateDoc(doc(this.col(), id), { ...input, example: false, updatedAt: new Date().toISOString() });
  }

  async markReviewed(id: string, kind: ReviewKind): Promise<void> {
    await updateDoc(doc(this.col(), id), { [`reviewed.${kind}`]: true });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id));
  }

  async importEntries(entries: Entry[]): Promise<void> {
    // 한 번에 최대 500건까지 묶어 쓸 수 있어서 400건씩 나눈다.
    for (let i = 0; i < entries.length; i += 400) {
      const batch = writeBatch(this.db);
      for (const e of entries.slice(i, i + 400)) {
        const { id, ...body } = e;
        batch.set(doc(this.col(), id), body);
      }
      await batch.commit();
    }
  }
}
