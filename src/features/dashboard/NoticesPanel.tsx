import { paths } from '../../app/router';
import { formatShort } from '../../shared/lib/dates';
import type { Notice } from '../notices/types';

const SHOW = 4;

/** 대시보드의 공지사항 (고정 공지 먼저, 최신순) */
export function NoticesPanel({ notices, loaded }: { notices: Notice[]; loaded: boolean }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>📢 공지사항</h2>
        <a className="more" href={paths.notices()}>
          전체 보기 →
        </a>
      </div>
      {!loaded && <p className="note">공지를 불러오는 중…</p>}
      {loaded && notices.length === 0 && (
        <p className="note">
          공지가 없어요. <a href={paths.noticeWrite()}>공지 쓰기</a>
        </p>
      )}
      {notices.length > 0 && (
        <ul className="recent">
          {notices.slice(0, SHOW).map((n) => (
            <li key={n.id}>
              <a href={paths.notices(n.id)}>
                <span className="t">
                  {n.pinned && <span className="badge">고정</span>} {n.title || '(제목 없음)'}
                </span>
                <span className="m mono">{formatShort(n.createdAt.slice(0, 10))}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
