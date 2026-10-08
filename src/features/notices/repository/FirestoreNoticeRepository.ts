import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { normalizeNotice, type Notice, type NoticeInput } from '../types';
import type { NoticeRepository } from './NoticeRepository';

/**
 * Firestore 구현체.
 * 저장 위치: users/{로그인한 사람의 uid}/notices/{공지 id}
 */
export class FirestoreNoticeRepository implements NoticeRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db = db;
    this.uid = uid;
  }

  private col() {
    return collection(this.db, 'users', this.uid, 'notices');
  }

  subscribe(onChange: (notices: Notice[]) => void, onError: (err: Error) => void): () => void {
    return onSnapshot(
      this.col(),
      (snap) => onChange(snap.docs.map((d) => normalizeNotice(d.id, d.data()))),
      (err) => onError(err),
    );
  }

  async create(id: string, input: NoticeInput): Promise<void> {
    const now = new Date().toISOString();
    await setDoc(doc(this.col(), id), { ...input, createdAt: now, updatedAt: now });
  }

  async update(id: string, input: NoticeInput): Promise<void> {
    await updateDoc(doc(this.col(), id), { ...input, updatedAt: new Date().toISOString() });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id));
  }

  async importNotices(notices: Notice[]): Promise<void> {
    for (let i = 0; i < notices.length; i += 400) {
      const batch = writeBatch(this.db);
      for (const n of notices.slice(i, i + 400)) {
        const { id, ...body } = n;
        batch.set(doc(this.col(), id), body);
      }
      await batch.commit();
    }
  }
}
