import { useMemo } from 'react';
import { paths } from '../app/router';
import { BoardNav } from '../features/board/BoardNav';
import { PostView, type Author } from '../features/entries/components/PostView';
import { numbering, toMarkdown } from '../features/entries/entryUtils';
import type { Entry } from '../features/entries/types';

interface Props {
  id: string;
  entries: Entry[];
  loaded: boolean;
  noticeCount: number;
  author: Author;
  onDelete: (e: Entry) => void;
  onCopy: (text: string, okMsg: string) => void;
}

/** 게시글 보기 화면 */
export function PostPage({ id, entries, loaded, noticeCount, author, onDelete, onCopy }: Props) {
  const numbers = useMemo(() => numbering(entries), [entries]);
  const entry = entries.find((e) => e.id === id);

  // 같은 게시판(분야·세부 항목) 안에서 이전·다음 글. entries는 최신순
  const sameBoard = entry ? entries.filter((e) => e.subject === entry.subject && (!entry.topic || e.topic === entry.topic)) : [];
  const idx = entry ? sameBoard.findIndex((e) => e.id === entry.id) : -1;

  return (
    <div className="board-layout">
      <BoardNav entries={entries} noticeCount={noticeCount} current={entry?.subject ?? ''} />
      {!loaded ? (
        <p className="note">글을 불러오는 중…</p>
      ) : !entry ? (
        <div className="panel howto">
          <h2 className="title">글을 찾지 못했어요</h2>
          <p className="note">지워졌거나 주소가 잘못되었을 수 있어요.</p>
          <div className="row">
            <a className="btn" href={paths.board()}>
              목록으로
            </a>
          </div>
        </div>
      ) : (
        <PostView
          key={entry.id}
          entry={entry}
          number={numbers.get(entry.id)}
          author={author}
          next={idx > 0 ? sameBoard[idx - 1] : null}
          prev={idx >= 0 && idx < sameBoard.length - 1 ? sameBoard[idx + 1] : null}
          onDelete={() => onDelete(entry)}
          onCopyMarkdown={() => onCopy(toMarkdown(entry), '마크다운으로 복사했어요. 노션·블로그에 붙여 넣으세요.')}
          onCopyCode={(code) => onCopy(code, '코드를 복사했어요.')}
        />
      )}
    </div>
  );
}
