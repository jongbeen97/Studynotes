import type { Entry, EntryInput, ReviewKind } from '../types';

/**
 * 기록 저장소 인터페이스.
 *
 * Spring의 Repository 인터페이스와 같은 역할이다. 화면(컴포넌트)은 이 인터페이스만 알고,
 * 실제로 Firestore에 저장하는지, 브라우저에 저장하는지는 모른다.
 * → 나중에 AWS(API Gateway + Lambda + DynamoDB)로 옮길 때 구현체 하나만 새로 만들면 된다.
 */
export interface EntryRepository {
  /** 화면에 표시할 이름 (예: "클라우드 동기화") */
  readonly label: string;

  /** 기록 목록이 바뀔 때마다 onChange가 불린다. 반환값을 호출하면 구독을 끊는다. */
  subscribe(onChange: (entries: Entry[]) => void, onError: (err: Error) => void): () => void;

  create(id: string, input: EntryInput, opts?: { example?: boolean }): Promise<void>;
  update(id: string, input: EntryInput): Promise<void>;
  markReviewed(id: string, kind: ReviewKind): Promise<void>;
  remove(id: string): Promise<void>;

  /** 백업 파일 가져오기. 같은 id가 있으면 덮어쓴다. */
  importEntries(entries: Entry[]): Promise<void>;
}

/** 새 기록의 id: 날짜 + 무작위 6글자 (예: 2026-10-08-k3x9ab) */
export function newEntryId(date: string): string {
  return `${date}-${Math.random().toString(36).slice(2, 8)}`;
}
