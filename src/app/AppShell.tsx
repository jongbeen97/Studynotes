import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import type { User } from 'firebase/auth';
import { downloadBackup, parseBackup } from '../features/entries/backup';
import { newEntryId, type EntryRepository } from '../features/entries/repository/EntryRepository';
import { EXAMPLE_INPUT, type Entry, type EntryInput, type ReviewKind } from '../features/entries/types';
import { useEntries } from '../features/entries/useEntries';
import type { NoticeRepository } from '../features/notices/repository/NoticeRepository';
import { newNoticeId, type Notice, type NoticeInput } from '../features/notices/types';
import { useNotices } from '../features/notices/useNotices';
import { Avatar } from '../features/profile/components/Avatar';
import type { ProfileRepository } from '../features/profile/repository/ProfileRepository';
import type { ProfileInput } from '../features/profile/types';
import { useProfile } from '../features/profile/useProfile';
import type { ScheduleRepository } from '../features/schedule/repository/ScheduleRepository';
import { newScheduleId, type ScheduleInput } from '../features/schedule/types';
import { useSchedules } from '../features/schedule/useSchedules';
import { BoardPage } from '../pages/BoardPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NoticesPage } from '../pages/NoticesPage';
import { NoticeWritePage } from '../pages/NoticeWritePage';
import { PostPage } from '../pages/PostPage';
import { ProfilePage } from '../pages/ProfilePage';
import { WritePage } from '../pages/WritePage';
import { InstallHint } from '../shared/components/Screens';
import { useToast } from '../shared/hooks/useToast';
import { useToday } from '../shared/hooks/useToday';
import { APP_NAME, STORAGE_KEYS } from '../shared/lib/constants';
import { firebaseEnabled } from '../shared/lib/firebase';
import { copyText, storageRemove } from '../shared/lib/platform';
import { navigate, paths, useRoute, type Route } from './router';

function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
}

function writeErrorMessage(e: unknown): string {
  switch (errorCode(e)) {
    case 'permission-denied':
      return '저장 권한이 없어요. 로그아웃한 뒤 다시 로그인해 주세요.';
    case 'unauthenticated':
      return '로그인이 풀렸어요. 다시 로그인해 주세요.';
    case 'resource-exhausted':
      return '오늘 무료 사용량을 넘었어요. 내일 다시 시도해 주세요.';
    default:
      return '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
  }
}

export interface Repos {
  label: string;
  entries: EntryRepository;
  schedules: ScheduleRepository;
  notices: NoticeRepository;
  profile: ProfileRepository;
}

interface Props {
  repos: Repos;
  user: User | null;
  onSignOut: (() => Promise<void>) | null;
}

/** 위쪽 탭 하나가 어떤 화면들을 묶는지 */
const TAB_OF: Record<Route['page'], string> = {
  dashboard: 'dashboard',
  board: 'board',
  post: 'board',
  write: 'board',
  notices: 'notices',
  'notice-write': 'notices',
  profile: 'profile',
};

/** 로그인 뒤의 앱 틀: 머리글·탭, 화면 전환, 저장 동작, 바닥글(백업) */
export function AppShell({ repos, user, onSignOut }: Props) {
  const account = user?.email ?? null;
  const { entries, loaded, error } = useEntries(repos.entries);
  const { schedules, loaded: schedulesLoaded } = useSchedules(repos.schedules);
  const { notices, loaded: noticesLoaded, error: noticesError } = useNotices(repos.notices);
  const { profile, loaded: profileLoaded, error: profileError } = useProfile(repos.profile);
  const today = useToday();
  const toast = useToast();
  const route = useRoute();
  const [map, setMap] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // 마지막으로 본 게시판 → 새 글의 게시판 기본값
  const lastBoard = useRef({ subject: '', topic: '' });
  if (route.page === 'board') lastBoard.current = { subject: route.subject, topic: route.topic };

  const author = { name: profile.nickname || account?.split('@')[0] || '나', photo: profile.photo };

  /** 저장·수정·삭제 결과 알림. 오프라인이면 기기에 먼저 저장되고 나중에 올라간다. */
  const runWrite = useCallback(
    (p: Promise<unknown>, okMsg: string) => {
      let notified = false;
      const timer = window.setTimeout(() => {
        notified = true;
        toast.show(`${okMsg} 인터넷이 연결되면 클라우드에 올라갑니다.`);
      }, 1500);
      p.then(() => {
        window.clearTimeout(timer);
        if (!notified) toast.show(okMsg);
      }).catch((err) => {
        window.clearTimeout(timer);
        toast.show(writeErrorMessage(err));
      });
    },
    [toast],
  );

  const saveEntry = (input: EntryInput, editId: string | null) => {
    if (editId) {
      runWrite(repos.entries.update(editId, input), '글을 수정했어요.');
      navigate(paths.post(editId));
    } else {
      const id = newEntryId(input.date);
      runWrite(repos.entries.create(id, input), '글을 등록했어요.');
      storageRemove(STORAGE_KEYS.draft);
      navigate(paths.post(id));
    }
  };

  const removeEntry = (e: Entry) => {
    runWrite(repos.entries.remove(e.id), e.example ? '예시를 지웠어요.' : '글을 지웠어요.');
    navigate(paths.board(e.subject, e.topic));
  };

  const markReviewed = (id: string, kind: ReviewKind) =>
    runWrite(repos.entries.markReviewed(id, kind), `${kind === 'd1' ? 'D+1' : 'D+7'} 복습을 표시했어요.`);

  const addExample = () => {
    const id = newEntryId(EXAMPLE_INPUT.date);
    runWrite(repos.entries.create(id, EXAMPLE_INPUT, { example: true }), '예시 글을 넣었어요.');
    navigate(paths.post(id));
  };

  const saveNotice = (input: NoticeInput, editId: string | null) => {
    if (editId) {
      runWrite(repos.notices.update(editId, input), '공지를 수정했어요.');
      navigate(paths.notices(editId));
    } else {
      const id = newNoticeId();
      runWrite(repos.notices.create(id, input), '공지를 등록했어요.');
      navigate(paths.notices(id));
    }
  };

  const removeNotice = (n: Notice) => {
    runWrite(repos.notices.remove(n.id), '공지를 지웠어요.');
    navigate(paths.notices());
  };

  const addSchedule = (input: ScheduleInput) => runWrite(repos.schedules.create(newScheduleId(input.date), input), '일정을 추가했어요.');
  const toggleSchedule = (id: string, done: boolean) => runWrite(repos.schedules.setDone(id, done), done ? '완료로 표시했어요.' : '완료를 해제했어요.');
  const removeSchedule = (id: string) => runWrite(repos.schedules.remove(id), '일정을 지웠어요.');

  const saveProfile = (input: ProfileInput, okMsg: string) => runWrite(repos.profile.update(input), okMsg);

  const filterByMap = (row: string) => {
    setMap((m) => (m === row ? '' : row));
    navigate(paths.board());
  };

  const copy = async (text: string, okMsg: string) => {
    toast.show((await copyText(text)) ? okMsg : '자동 복사가 막혀 있어요. 직접 선택해서 복사해 주세요.');
  };

  const importFile = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (!backup) return toast.show('백업 파일 형식이 아니에요. 이 앱에서 내보낸 JSON 파일을 골라 주세요.');
    const { entries: list, schedules: plans, notices: posts } = backup;
    if (!list.length && !plans.length && !posts.length) return toast.show('파일에 기록이 없어요.');
    const parts = [`글 ${list.length}건`, plans.length && `일정 ${plans.length}건`, posts.length && `공지 ${posts.length}건`].filter(Boolean);
    runWrite(
      Promise.all([repos.entries.importEntries(list), repos.schedules.importSchedules(plans), repos.notices.importNotices(posts)]),
      `${parts.join(', ')}을 가져왔어요.`,
    );
  };

  const tab = (name: string) => (TAB_OF[route.page] === name ? 'page' : undefined);

  let page;
  switch (route.page) {
    case 'dashboard':
      page = (
        <DashboardPage
          entries={entries}
          entriesLoaded={loaded}
          schedules={schedules}
          schedulesLoaded={schedulesLoaded}
          notices={notices}
          noticesLoaded={noticesLoaded}
          today={today}
          activeMap={map}
          onMapFilter={filterByMap}
          onSubjectFilter={(subject) => navigate(paths.board(subject))}
          onReviewed={markReviewed}
          onAddSchedule={addSchedule}
          onToggleSchedule={toggleSchedule}
          onRemoveSchedule={removeSchedule}
        />
      );
      break;
    case 'board':
      page = (
        <BoardPage
          key={`${route.subject}/${route.topic}`}
          subject={route.subject}
          topic={route.topic}
          entries={entries}
          loaded={loaded}
          error={error}
          notices={notices}
          map={map}
          onClearMap={() => setMap('')}
          onAddExample={addExample}
        />
      );
      break;
    case 'post':
      page = <PostPage id={route.id} entries={entries} loaded={loaded} noticeCount={notices.length} author={author} onDelete={removeEntry} onCopy={copy} />;
      break;
    case 'write':
      page = <WritePage key={route.id ?? 'new'} editId={route.id} entries={entries} loaded={loaded} today={today} board={lastBoard.current} onSave={saveEntry} />;
      break;
    case 'notices':
      page = (
        <NoticesPage
          key={route.id ?? 'list'}
          id={route.id}
          notices={notices}
          loaded={noticesLoaded}
          error={noticesError}
          entries={entries}
          author={author}
          onDelete={removeNotice}
          onCopy={copy}
        />
      );
      break;
    case 'notice-write':
      page = <NoticeWritePage key={route.id ?? 'new'} editId={route.id} notices={notices} loaded={noticesLoaded} onSave={saveNotice} />;
      break;
    case 'profile':
      page = <ProfilePage user={user} profile={profile} loaded={profileLoaded} error={profileError} onSave={saveProfile} />;
      break;
  }

  return (
    <div className="wrap">
      <InstallHint />
      {!firebaseEnabled && (
        <div className="banner warn">
          <span>
            <b>Firebase 설정 전:</b> 지금은 이 브라우저에만 저장돼요. README의 2~3단계를 따라 하면 iPhone·iPad·Mac에서 같은 기록을 봅니다.
          </span>
        </div>
      )}

      <header className="top">
        <h1>
          <a className="home" href={paths.dashboard}>
            {APP_NAME}
          </a>
        </h1>
        <div className="row">
          <a className="btn primary" href={paths.write()} aria-current={route.page === 'write' && !route.id ? 'page' : undefined}>
            ✎ 글쓰기
          </a>
          <a className="me" href={paths.profile} aria-label="내 정보" title="내 정보" aria-current={tab('profile')}>
            <Avatar photo={profile.photo} name={author.name} />
          </a>
        </div>
      </header>

      <nav className="tabs" aria-label="화면">
        <a href={paths.dashboard} aria-current={tab('dashboard')}>
          대시보드
        </a>
        <a href={paths.board()} aria-current={tab('board')}>
          개발일지 <span className="mono">{loaded ? entries.length : ''}</span>
        </a>
        <a href={paths.notices()} aria-current={tab('notices')}>
          공지사항
        </a>
        <a href={paths.profile} aria-current={tab('profile')}>
          내 정보
        </a>
      </nav>

      {page}

      <footer className="foot">
        <span className="note">
          {repos.label}
          {account ? ` · ${account}` : ''}
        </span>
        <div className="row">
          <button
            type="button"
            className="btn small"
            onClick={() => downloadBackup({ entries, schedules, notices }, today)}
            disabled={!entries.length && !schedules.length && !notices.length}
          >
            백업 내보내기
          </button>
          <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
            백업 가져오기
          </button>
          <input ref={fileRef} id="backup-file" type="file" accept="application/json,.json" hidden onChange={importFile} />
          {onSignOut && (
            <button type="button" className="btn small" onClick={() => void onSignOut()}>
              로그아웃
            </button>
          )}
        </div>
      </footer>

      {toast.message && (
        <div className="toast" role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}
