import { doc, onSnapshot, setDoc, type Firestore } from 'firebase/firestore';
import { normalizeProfile, type Profile, type ProfileInput } from '../types';
import type { ProfileRepository } from './ProfileRepository';

/**
 * Firestore 구현체.
 * 저장 위치: users/{uid}/meta/profile
 * 프로필 사진은 Cloud Storage(유료 요금제 필요) 대신 작게 줄여 이 문서 안에 함께 저장한다.
 */
export class FirestoreProfileRepository implements ProfileRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db = db;
    this.uid = uid;
  }

  private ref() {
    return doc(this.db, 'users', this.uid, 'meta', 'profile');
  }

  subscribe(onChange: (profile: Profile) => void, onError: (err: Error) => void): () => void {
    return onSnapshot(
      this.ref(),
      (snap) => onChange(normalizeProfile(snap.data())),
      (err) => onError(err),
    );
  }

  async update(input: ProfileInput): Promise<void> {
    await setDoc(this.ref(), { ...input, updatedAt: new Date().toISOString() }, { merge: true });
  }
}
