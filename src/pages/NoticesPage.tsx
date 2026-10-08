import { useState } from 'react';
import { paths } from '../app/router';
import { BoardNav } from '../features/board/BoardNav';
import type { Author } from '../features/entries/components/PostView';
import type { Entry } from '../features/entries/types';
import { Avatar } from '../features/profile/components/Avatar';
import type { Notice } from '../features/notices/types';
import { Pagination } from '../shared/components/Pagination';
import { PostBody } from '../shared/components/PostBody';
import { formatLong, formatShort } from '../shared/lib/dates';

interface Props {
  id: string | null;
  notices: Notice[];
  loaded: boolean;
  error: string | null;
  entries: Entry[];
  author: Author;
  onDelete: (n: Notice) => void;
  onCopy: (text: string, okMsg: string) => void;
}

const PAGE_SIZE = 15;

/** 공지사항 게시판: 목록, 또는 id가 있으면 공지 한 편 */
export function NoticesPage({ id, notices, loaded, error, entries, author, onDelete, onCopy }: Props) {
  return (
    <div className="board-layout">
      <BoardNav entries={entries} noticeCount={notices.length} current="notices" />
      {id ? (
        <NoticeView notice={notices.find((n) => n.id === id) ?? null} loaded={loaded} author={author} onDelete={onDelete} onCopy={onCopy} />
      ) : (
        <NoticeList notices={notices} loaded={loaded} error={error} />
      )}
    </div>
  );
}

function NoticeList({ notices, loaded, error }: { notices: Notice[]; loaded: boolean; error: string | null }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = notices.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  // 번호는 오래된 공지부터 1, 2, 3 …
  const order = [...notices].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const numberOf = (n: Notice) => order.indexOf(n) + 1;

  return (
    <section className="panel board" aria-label="공지사항">
      <div className="board-head">
        <div>
          <div className="crumb">게시판</div>
          <h2 className="board-title">
            📢 공지사항 <span className="count">{loaded ? `${notices.length}개` : ''}</span>
          </h2>
        </div>
        <a className="btn primary" href={paths.noticeWrite()}>
          ✎ 공지 쓰기
        </a>
      </div>
      <table className="board-table">
        <thead>
          <tr>
            <th className="c-no">번호</th>
            <th>제목</th>
            <th className="c-date">작성일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.id} className={n.pinned ? 'notice-row' : undefined}>
              <td className="c-no mono">{n.pinned ? <span className="badge">고정</span> : numberOf(n)}</td>
              <td className="c-title">
                <a href={paths.notices(n.id)}>{n.title || '(제목 없음)'}</a>
              </td>
              <td className="c-date mono">{formatShort(n.createdAt.slice(0, 10))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <div className="empty">공지를 불러오지 못했어요. ({error})</div>}
      {!error && !loaded && <div className="empty">공지를 불러오는 중…</div>}
      {loaded && !error && notices.length === 0 && (
        <div className="empty">아직 공지가 없어요. 이번 주 목표나 과제 일정 같은 걸 공지로 남겨 두면 대시보드에 함께 보여요.</div>
      )}
      <Pagination page={current} total={pages} onChange={setPage} />
    </section>
  );
}

interface ViewProps {
  notice: Notice | null;
  loaded: boolean;
  author: Author;
  onDelete: (n: Notice) => void;
  onCopy: (text: string, okMsg: string) => void;
}

function NoticeView({ notice: n, loaded, author, onDelete, onCopy }: ViewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!loaded) return <p className="note">공지를 불러오는 중…</p>;
  if (!n)
    return (
      <div className="panel howto">
        <h2 className="title">공지를 찾지 못했어요</h2>
        <div className="row">
          <a className="btn" href={paths.notices()}>
            목록으로
          </a>
        </div>
      </div>
    );

  return (
    <article className="panel post">
      <div className="crumb">
        <a href={paths.notices()}>공지사항</a>
      </div>
      <header className="post-head">
        <h1 className="post-title">
          {n.pinned && <span className="badge">고정</span>} {n.title || '(제목 없음)'}
        </h1>
        <div className="post-meta">
          <span className="post-author">
            <Avatar photo={author.photo} name={author.name} />
            <b>{author.name}</b>
          </span>
          <span className="mono">{formatLong(n.createdAt.slice(0, 10))}</span>
          {n.updatedAt > n.createdAt && n.updatedAt.slice(0, 10) !== n.createdAt.slice(0, 10) && <span>수정됨 {formatShort(n.updatedAt.slice(0, 10))}</span>}
        </div>
      </header>
      <PostBody text={n.content} onCopyCode={(code) => onCopy(code, '코드를 복사했어요.')} />
      <div className="actions">
        <a className="btn" href={paths.notices()}>
          목록
        </a>
        <a className="btn" href={paths.noticeWrite(n.id)}>
          수정
        </a>
        {!confirmDelete ? (
          <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>
            삭제
          </button>
        ) : (
          <>
            <button type="button" className="btn danger" onClick={() => onDelete(n)}>
              정말 삭제
            </button>
            <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
              취소
            </button>
          </>
        )}
      </div>
    </article>
  );
}
