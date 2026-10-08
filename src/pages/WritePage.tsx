import { useState } from 'react';
import { navigate, paths } from '../app/router';
import { EntryEditor } from '../features/entries/components/EntryEditor';
import { emptyInput, toInput, type Entry, type EntryInput } from '../features/entries/types';
import { STORAGE_KEYS } from '../shared/lib/constants';
import { storageGet, storageRemove } from '../shared/lib/platform';

interface Props {
  editId: string | null;
  entries: Entry[];
  loaded: boolean;
  today: string;
  /** 마지막으로 보던 게시판. 새 글의 게시판 기본값 */
  board: { subject: string; topic: string };
  onSave: (input: EntryInput, editId: string | null) => void;
}

/** 글쓰기·수정 화면 */
export function WritePage({ editId, entries, loaded, today, board, onSave }: Props) {
  if (!editId) return <NewEntry today={today} board={board} onSave={(input) => onSave(input, null)} />;

  const entry = entries.find((e) => e.id === editId);
  return (
    <article className="panel compose">
      {!loaded ? (
        <p className="note">글을 불러오는 중…</p>
      ) : !entry ? (
        <div className="howto">
          <h2 className="title">수정할 글을 찾지 못했어요</h2>
          <p className="note">지워졌거나 주소가 잘못되었을 수 있어요.</p>
          <div className="row">
            <a className="btn" href={paths.board()}>
              목록으로
            </a>
          </div>
        </div>
      ) : (
        <EntryEditor
          key={entry.id}
          mode="edit"
          initial={toInput(entry)}
          restoredDraft={false}
          onSave={(input) => onSave(input, entry.id)}
          onCancel={() => navigate(paths.post(entry.id))}
        />
      )}
    </article>
  );
}

/** 쓰다 만 임시 저장이 있으면 이어서 쓴다 */
function loadDraft(today: string, board: { subject: string; topic: string }): { initial: EntryInput; restored: boolean } {
  const initial = { ...emptyInput(today), ...board };
  const raw = storageGet(STORAGE_KEYS.draft);
  if (!raw) return { initial, restored: false };
  try {
    const d = JSON.parse(raw) as Partial<EntryInput>;
    if (d.title || d.content || d.summary || d.concepts) return { initial: { ...initial, ...d }, restored: true };
  } catch {
    /* 깨진 임시 저장은 무시 */
  }
  return { initial, restored: false };
}

function NewEntry({ today, board, onSave }: { today: string; board: { subject: string; topic: string }; onSave: (input: EntryInput) => void }) {
  const [{ initial, restored }] = useState(() => loadDraft(today, board));
  return (
    <article className="panel compose">
      <EntryEditor
        mode="new"
        initial={initial}
        restoredDraft={restored}
        onSave={onSave}
        onCancel={() => {
          storageRemove(STORAGE_KEYS.draft);
          navigate(paths.board(board.subject, board.topic));
        }}
      />
    </article>
  );
}
