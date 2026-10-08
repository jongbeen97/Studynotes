import { useMemo, useState } from 'react';
import { paths } from '../app/router';
import { BoardNav } from '../features/board/BoardNav';
import { filterEntries, numbering } from '../features/entries/entryUtils';
import type { Entry } from '../features/entries/types';
import type { Notice } from '../features/notices/types';
import { Pagination } from '../shared/components/Pagination';
import { Squares } from '../shared/components/Squares';
import { topicsOf } from '../shared/lib/constants';
import { formatShort } from '../shared/lib/dates';

interface Props {
  subject: string;
  topic: string;
  entries: Entry[];
  loaded: boolean;
  error: string | null;
  notices: Notice[];
  map: string;
  onClearMap: () => void;
  onAddExample: () => void;
}

const PAGE_SIZE = 15;
const PINNED_SHOW = 3;

/** 개발일지 게시판: 분야 → 세부 항목 탭 → 글 목록 */
export function BoardPage({ subject, topic, entries, loaded, error, notices, map, onClearMap, onAddExample }: Props) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const numbers = useMemo(() => numbering(entries), [entries]);

  const inSubject = subject ? entries.filter((e) => e.subject === subject) : entries;
  const list = filterEntries(entries, { subject, topic, map, q });
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pinned = notices.filter((n) => n.pinned).slice(0, PINNED_SHOW);
  const topics = topicsOf(subject);
  const title = topic || subject || '전체글';

  return (
    <div className="board-layout">
      <BoardNav entries={entries} noticeCount={notices.length} current={subject} />

      <section className="panel board" aria-label={`${title} 게시판`}>
        <div className="board-head">
          <div>
            <div className="crumb">
              <a href={paths.board()}>개발일지</a>
              {subject && (
                <>
                  {' › '}
                  <a href={paths.board(subject)}>{subject}</a>
                </>
              )}
            </div>
            <h2 className="board-title">
              {title} <span className="count">{loaded ? `${list.length}개의 글` : ''}</span>
            </h2>
          </div>
          <a className="btn primary" href={paths.write()}>
            ✎ 글쓰기
          </a>
        </div>

        {topics.length > 0 && (
          <nav className="board-tabs" aria-label={`${subject} 세부 게시판`}>
            <a href={paths.board(subject)} aria-current={!topic ? 'page' : undefined}>
              전체 <em>{inSubject.length}</em>
            </a>
            {topics.map((t) => (
              <a key={t} href={paths.board(subject, t)} aria-current={topic === t ? 'page' : undefined}>
                {t} <em>{inSubject.filter((e) => e.topic === t).length}</em>
              </a>
            ))}
          </nav>
        )}

        <div className="board-tools">
          <input
            className="input"
            type="search"
            placeholder="제목·본문·명령어 검색"
            aria-label="게시글 검색"
            value={q}
            onChange={(ev) => {
              setQ(ev.target.value);
              setPage(1);
            }}
          />
          {map && (
            <span className="pill">
              개념 지도: {map}
              <button type="button" aria-label="개념 지도 거르기 해제" onClick={onClearMap}>
                ×
              </button>
            </span>
          )}
        </div>

        <table className="board-table">
          <thead>
            <tr>
              <th className="c-no">번호</th>
              {!topic && <th className="c-cat">분야</th>}
              <th>제목</th>
              <th className="c-date">작성일</th>
              <th className="c-level">이해도</th>
            </tr>
          </thead>
          <tbody>
            {current === 1 &&
              pinned.map((n) => (
                <tr key={n.id} className="notice-row">
                  <td className="c-no">
                    <span className="badge">공지</span>
                  </td>
                  {!topic && <td className="c-cat" />}
                  <td className="c-title">
                    <a href={paths.notices(n.id)}>{n.title || '(제목 없음)'}</a>
                  </td>
                  <td className="c-date mono">{formatShort(n.createdAt.slice(0, 10))}</td>
                  <td className="c-level" />
                </tr>
              ))}
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="c-no mono">{e.example ? <span className="tag ex">예시</span> : numbers.get(e.id)}</td>
                {!topic && (
                  <td className="c-cat">
                    <span className="tag">{subject ? e.topic || subject : e.subject}</span>
                  </td>
                )}
                <td className="c-title">
                  <a href={paths.post(e.id)}>{e.title || '(제목 없음)'}</a>
                  {e.code.trim() && <span className="hint-icon" title="명령어·코드 있음">{'</>'}</span>}
                </td>
                <td className="c-date mono">{formatShort(e.date)}</td>
                <td className="c-level">
                  <Squares filled={e.understanding} label={`이해도 ${e.understanding}/5`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && <div className="empty">기록을 불러오지 못했어요. ({error})</div>}
        {!error && !loaded && <div className="empty">기록을 불러오는 중…</div>}
        {loaded && !error && list.length === 0 && (
          <div className="empty board-empty">
            {entries.length === 0 ? (
              <>
                <span>아직 쓴 글이 없어요. 오늘 배운 것을 첫 글로 남겨 보세요.</span>
                <div className="row">
                  <a className="btn primary small" href={paths.write()}>
                    ✎ 글쓰기
                  </a>
                  <button type="button" className="btn small" onClick={onAddExample}>
                    예시 글 넣어 보기
                  </button>
                </div>
              </>
            ) : q || map ? (
              '조건에 맞는 글이 없어요. 검색어나 거르기를 풀어 보세요.'
            ) : (
              `‘${title}’ 게시판에 아직 글이 없어요.`
            )}
          </div>
        )}

        <Pagination page={current} total={pages} onChange={setPage} />
      </section>
    </div>
  );
}
