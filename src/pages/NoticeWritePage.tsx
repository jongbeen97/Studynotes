import { navigate, paths } from '../app/router';
import { NoticeEditor } from '../features/notices/components/NoticeEditor';
import { emptyNotice, type Notice, type NoticeInput } from '../features/notices/types';

interface Props {
  editId: string | null;
  notices: Notice[];
  loaded: boolean;
  onSave: (input: NoticeInput, editId: string | null) => void;
}

/** 공지 쓰기·수정 화면 */
export function NoticeWritePage({ editId, notices, loaded, onSave }: Props) {
  const notice = editId ? notices.find((n) => n.id === editId) : null;
  return (
    <article className="panel compose">
      {!editId ? (
        <NoticeEditor mode="new" initial={emptyNotice()} onSave={(input) => onSave(input, null)} onCancel={() => navigate(paths.notices())} />
      ) : !loaded ? (
        <p className="note">공지를 불러오는 중…</p>
      ) : !notice ? (
        <div className="howto">
          <h2 className="title">수정할 공지를 찾지 못했어요</h2>
          <div className="row">
            <a className="btn" href={paths.notices()}>
              목록으로
            </a>
          </div>
        </div>
      ) : (
        <NoticeEditor
          key={notice.id}
          mode="edit"
          initial={{ title: notice.title, content: notice.content, pinned: notice.pinned }}
          onSave={(input) => onSave(input, notice.id)}
          onCancel={() => navigate(paths.notices(notice.id))}
        />
      )}
    </article>
  );
}
