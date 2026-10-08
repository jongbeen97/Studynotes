/** 공지 입력값 */
export interface NoticeInput {
  title: string;
  content: string;
  pinned: boolean; // 게시판 맨 위에 고정
}

/** 저장된 공지 */
export interface Notice extends NoticeInput {
  id: string;
  createdAt: string; // ISO 시각
  updatedAt: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const emptyNotice = (): NoticeInput => ({ title: '', content: '', pinned: false });

export function normalizeNotice(id: string, raw: Record<string, unknown>): Notice {
  return {
    id,
    title: str(raw.title).slice(0, 200),
    content: str(raw.content),
    pinned: raw.pinned === true,
    createdAt: str(raw.createdAt) || new Date(0).toISOString(),
    updatedAt: str(raw.updatedAt) || new Date(0).toISOString(),
  };
}

/** 고정 공지가 먼저, 그다음 최신순 */
export function sortNotices(list: Notice[]): Notice[] {
  return [...list].sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : b.createdAt.localeCompare(a.createdAt)));
}

export function newNoticeId(): string {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `notice-${d}-${Math.random().toString(36).slice(2, 8)}`;
}
