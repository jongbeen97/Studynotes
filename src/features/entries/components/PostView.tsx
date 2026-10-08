import { useState } from 'react';
import { paths } from '../../../app/router';
import { PostBody } from '../../../shared/components/PostBody';
import { Squares } from '../../../shared/components/Squares';
import { COURSE, LEVELS } from '../../../shared/lib/constants';
import { dayNumber, formatLong, formatShort } from '../../../shared/lib/dates';
import { Avatar } from '../../profile/components/Avatar';
import { parseConcepts } from '../entryUtils';
import type { Entry } from '../types';

export interface Author {
  name: string;
  photo: string;
}

interface Props {
  entry: Entry;
  number: number | undefined;
  author: Author;
  prev: Entry | null; // 같은 게시판의 이전 글 (더 오래된 글)
  next: Entry | null;
  onDelete: () => void;
  onCopyMarkdown: () => void;
  onCopyCode: (code: string) => void;
}

/** 게시글 한 편: 제목·작성 정보·본문·학습 정리·이전/다음 글 */
export function PostView({ entry: e, number, author, prev, next, onDelete, onCopyMarkdown, onCopyCode }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inCourse = dayNumber(e.date) >= dayNumber(COURSE.start) && dayNumber(e.date) <= dayNumber(COURSE.end);
  const concepts = parseConcepts(e.concepts);
  const summaryLines = e.summary.split('\n').filter((l) => l.trim());
  const hasStudy = summaryLines.length > 0 || concepts.length > 0 || e.code.trim() || e.errors.trim() || e.questions.trim() || e.mapRows.length > 0;
  const edited = e.updatedAt.slice(0, 10) !== e.createdAt.slice(0, 10) && e.updatedAt > e.createdAt;

  return (
    <article className="panel post">
      <div className="crumb">
        <a href={paths.board()}>개발일지</a> › <a href={paths.board(e.subject)}>{e.subject}</a>
        {e.topic && (
          <>
            {' › '}
            <a href={paths.board(e.subject, e.topic)}>{e.topic}</a>
          </>
        )}
      </div>

      <header className="post-head">
        <h1 className="post-title">{e.title || '(제목 없음)'}</h1>
        <div className="post-meta">
          <span className="post-author">
            <Avatar photo={author.photo} name={author.name} />
            <b>{author.name}</b>
          </span>
          <span className="mono">{formatLong(e.date)}</span>
          <span className="mono">{e.example ? '예시' : `No.${String(number ?? 0).padStart(3, '0')}`}</span>
          {inCourse && <span>과정 {dayNumber(e.date) - dayNumber(COURSE.start) + 1}일차</span>}
          {edited && <span>수정됨 {formatShort(e.updatedAt.slice(0, 10))}</span>}
          <span className="level">
            이해도 <Squares filled={e.understanding} size="md" /> {LEVELS[e.understanding - 1]}
          </span>
        </div>
      </header>

      {e.example && (
        <div className="example">
          <span>예시 글이에요. 어떻게 쓰는지 본 뒤 지워도 됩니다.</span>
          <button type="button" className="btn small" onClick={onDelete}>
            예시 지우기
          </button>
        </div>
      )}

      {e.content.trim() ? <PostBody text={e.content} onCopyCode={onCopyCode} /> : !hasStudy && <p className="note">본문이 없어요.</p>}

      {hasStudy && (
        <section className="study" aria-label="학습 정리">
          <h2>학습 정리</h2>
          {summaryLines.length > 0 && (
            <section className="sec">
              <h3>오늘 배운 것</h3>
              <div className="prose">
                {summaryLines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            </section>
          )}
          {concepts.length > 0 && (
            <section className="sec">
              <h3>핵심 개념</h3>
              <dl className="defs">
                {concepts.map((c, i) => (
                  <div key={i} className="def-row">
                    <dt>{c.term || '·'}</dt>
                    <dd>{c.desc}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {e.code.trim() && (
            <section className="sec">
              <h3>명령어 · 코드</h3>
              <div className="codebox">
                <pre>
                  <code>{e.code}</code>
                </pre>
                <button type="button" className="btn small" onClick={() => onCopyCode(e.code)}>
                  복사
                </button>
              </div>
            </section>
          )}
          {e.errors.trim() && (
            <section className="sec">
              <h3>에러 노트</h3>
              <p className="errbox">{e.errors}</p>
            </section>
          )}
          {e.questions.trim() && (
            <section className="sec">
              <h3>헷갈린 점 · 질문</h3>
              <p className="qbox">
                <span>{e.questions}</span>
              </p>
            </section>
          )}
          {e.mapRows.length > 0 && (
            <section className="sec">
              <h3>개념 지도 칸</h3>
              <div className="chips">
                {e.mapRows.map((m) => (
                  <span key={m} className="chip">
                    {m}
                  </span>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      <p className="revline">
        D+1 복습 {e.reviewed.d1 ? <b>완료</b> : '전'} · D+7 복습 {e.reviewed.d7 ? <b>완료</b> : '전'}
      </p>

      <div className="actions">
        <a className="btn" href={paths.board(e.subject, e.topic)}>
          목록
        </a>
        <a className="btn" href={paths.write(e.id)}>
          수정
        </a>
        <button type="button" className="btn" onClick={onCopyMarkdown}>
          마크다운 복사
        </button>
        {!confirmDelete ? (
          <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>
            삭제
          </button>
        ) : (
          <>
            <button type="button" className="btn danger" onClick={onDelete}>
              정말 삭제
            </button>
            <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
              취소
            </button>
          </>
        )}
      </div>

      <nav className="post-nav" aria-label="이전·다음 글">
        <PostLink label="다음 글" entry={next} />
        <PostLink label="이전 글" entry={prev} />
      </nav>
    </article>
  );
}

function PostLink({ label, entry }: { label: string; entry: Entry | null }) {
  return (
    <div className="post-link">
      <span className="lab">{label}</span>
      {entry ? (
        <a href={paths.post(entry.id)}>
          {entry.title || '(제목 없음)'} <small className="mono">{formatShort(entry.date)}</small>
        </a>
      ) : (
        <span className="note">없음</span>
      )}
    </div>
  );
}
