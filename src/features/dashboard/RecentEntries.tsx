import { paths } from '../../app/router';
import { Squares } from '../../shared/components/Squares';
import { formatShort } from '../../shared/lib/dates';
import { subjectLabel, type Entry } from '../entries/types';

interface Props {
  entries: Entry[];
  loaded: boolean;
}

const SHOW = 5;

/** 최근에 등록한 일지 (등록한 시각 기준 최신순) */
export function RecentEntries({ entries, loaded }: Props) {
  const recent = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, SHOW);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>최근 등록한 글</h2>
        <a className="more" href={paths.board()}>
          전체 보기 →
        </a>
      </div>
      {!loaded && <p className="note">기록을 불러오는 중…</p>}
      {loaded && recent.length === 0 && (
        <p className="note">
          아직 쓴 글이 없어요. <a href={paths.write()}>첫 글 쓰기</a>
        </p>
      )}
      {recent.length > 0 && (
        <ul className="recent">
          {recent.map((e) => (
            <li key={e.id}>
              <a href={paths.post(e.id)}>
                <span className="t">{e.title || '(제목 없음)'}</span>
                <span className="m">
                  <span className="mono">{formatShort(e.date)}</span>
                  {e.example && <span className="tag ex">예시</span>}
                  <span className="tag">{subjectLabel(e)}</span>
                  <Squares filled={e.understanding} label={`이해도 ${e.understanding}/5`} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
