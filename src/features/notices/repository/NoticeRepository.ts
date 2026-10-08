import type { Notice, NoticeInput } from '../types';

/** 공지사항 저장소 인터페이스 */
export interface NoticeRepository {
  subscribe(onChange: (notices: Notice[]) => void, onError: (err: Error) => void): () => void;
  create(id: string, input: NoticeInput): Promise<void>;
  update(id: string, input: NoticeInput): Promise<void>;
  remove(id: string): Promise<void>;
  /** 백업 파일 가져오기. 같은 id가 있으면 덮어쓴다. */
  importNotices(notices: Notice[]): Promise<void>;
}
