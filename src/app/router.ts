import { useEffect, useState } from 'react';

/*
 * 주소 뒤의 #/... 로 화면을 고른다 (해시 라우팅).
 * 서버 설정 없이 동작하고, 홈 화면에 설치한 앱(PWA)에서도 뒤로 가기가 자연스럽다.
 *   #/                       대시보드
 *   #/board                  개발일지 게시판 전체 (#/board/언어, #/board/언어/Java)
 *   #/post/{id}              게시글 보기
 *   #/write                  새 글 쓰기 (#/write/{id} 는 수정)
 *   #/notices                공지사항 (#/notices/{id} 는 공지 보기)
 *   #/notice-write           공지 쓰기 (#/notice-write/{id} 는 수정)
 *   #/profile                내 정보
 */
export type Route =
  | { page: 'dashboard' }
  | { page: 'board'; subject: string; topic: string }
  | { page: 'post'; id: string }
  | { page: 'write'; id: string | null }
  | { page: 'notices'; id: string | null }
  | { page: 'notice-write'; id: string | null }
  | { page: 'profile' };

const enc = encodeURIComponent;

export const paths = {
  dashboard: '#/',
  board: (subject = '', topic = '') => `#/board${subject ? `/${enc(subject)}` : ''}${subject && topic ? `/${enc(topic)}` : ''}`,
  post: (id: string) => `#/post/${enc(id)}`,
  write: (id?: string) => (id ? `#/write/${enc(id)}` : '#/write'),
  notices: (id?: string) => (id ? `#/notices/${enc(id)}` : '#/notices'),
  noticeWrite: (id?: string) => (id ? `#/notice-write/${enc(id)}` : '#/notice-write'),
  profile: '#/profile',
};

function decode(s: string | undefined): string {
  if (!s) return '';
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
}

export function parseRoute(hash: string): Route {
  const [, page = '', a, b] = hash.replace(/^#/, '').split('/');
  const first = decode(a);
  switch (page) {
    case 'board':
      return { page: 'board', subject: first, topic: first ? decode(b) : '' };
    case 'post':
      return first ? { page: 'post', id: first } : { page: 'board', subject: '', topic: '' };
    case 'write':
      return { page: 'write', id: first || null };
    case 'notices':
      return { page: 'notices', id: first || null };
    case 'notice-write':
      return { page: 'notice-write', id: first || null };
    case 'profile':
      return { page: 'profile' };
    case 'logs': // 예전 주소(#/logs/{id})로 저장해 둔 즐겨찾기도 열리게
      return first ? { page: 'post', id: first } : { page: 'board', subject: '', topic: '' };
    default:
      return { page: 'dashboard' };
  }
}

export function navigate(path: string): void {
  if (location.hash !== path) location.hash = path;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
