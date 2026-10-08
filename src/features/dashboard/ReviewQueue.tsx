import { formatShort } from '../../shared/lib/dates';
import { reviewItems } from '../entries/entryUtils';
import type { Entry, ReviewKind } from '../entries/types';

interface Props {
  entries: Entry[];
  loaded: boolean;
  today: string;
  onOpen: (id: string) => void;
  onReviewed: (id: string, kind: ReviewKind) => void;
}

const SHOW = 6;

export function ReviewQueue({ entries, loaded, today, onOpen, onReviewed }: Props) {
  const items = loaded ? reviewItems(entries, today) : [];
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>오늘 복습할 것</h2>
        <span className="count">{items.length ? `${items.length}건` : ''}</span>
      </div>
      {!loaded && <p className="note">기록을 불러오는 중…</p>}
      {loaded && items.length === 0 && (
        <p className="note">오늘은 복습할 기록이 없어요. 기록한 다음 날(D+1)과 일주일 뒤(D+7)에 여기 올라옵니다.</p>
      )}
      {items.length > 0 && (
        <>
          <ul className="queue">
            {items.slice(0, SHOW).map(({ entry, kind }) => (
              <li key={`${entry.id}-${kind}`}>
                <span className={`due ${kind}`}>{kind === 'd1' ? 'D+1' : 'D+7'}</span>
                <button type="button" className="linkish" title={entry.title} onClick={() => onOpen(entry.id)}>
                  {entry.title || '(제목 없음)'}
                  <small>{formatShort(entry.date)}</small>
                </button>
                <button type="button" className="btn small" onClick={() => onReviewed(entry.id, kind)}>
                  복습 완료
                </button>
              </li>
            ))}
          </ul>
          <p className="note">
            {items.length > SHOW
              ? `외 ${items.length - SHOW}건이 더 있어요.`
              : '강의 없이 내용을 떠올려 본 뒤 기록을 열어 확인하세요.'}
          </p>
        </>
      )}
    </div>
  );
}
