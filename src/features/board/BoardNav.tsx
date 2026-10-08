import { paths } from '../../app/router';
import { CATEGORIES } from '../../shared/lib/constants';
import type { Entry } from '../entries/types';

interface Props {
  entries: Entry[];
  noticeCount: number;
  /** 지금 보고 있는 게시판. 공지사항이면 'notices' */
  current: string | 'notices';
}

/** 게시판 왼쪽 메뉴: 전체글, 공지사항, 분야별 게시판 */
export function BoardNav({ entries, noticeCount, current }: Props) {
  const count = (subject: string) => entries.filter((e) => e.subject === subject).length;
  const cls = (on: boolean, zero = false) => [on ? 'active' : '', zero ? 'zero' : ''].filter(Boolean).join(' ') || undefined;

  return (
    <nav className="board-nav" aria-label="게시판">
      <div className="board-nav-group">
        <a href={paths.notices()} className={cls(current === 'notices')} aria-current={current === 'notices' ? 'page' : undefined}>
          <span>📢 공지사항</span>
          <em>{noticeCount}</em>
        </a>
        <a href={paths.board()} className={cls(current === '')} aria-current={current === '' ? 'page' : undefined}>
          <span>전체글</span>
          <em>{entries.length}</em>
        </a>
      </div>
      <div className="board-nav-title">분야</div>
      <div className="board-nav-group">
        {CATEGORIES.map((c) => {
          const n = count(c.name);
          const on = current === c.name;
          return (
            <a key={c.name} href={paths.board(c.name)} className={cls(on, n === 0)} aria-current={on ? 'page' : undefined}>
              <span>{c.name}</span>
              <em>{n}</em>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
