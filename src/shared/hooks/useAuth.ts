import { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../lib/firebase';
import { isMobileDevice, isStandalone } from '../lib/platform';

function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
}

/** Firebase 로그인 에러 코드를 사람이 읽을 수 있는 문장으로 */
function authMessage(e: unknown): string | null {
  const code = errorCode(e);
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null; // 사용자가 창을 닫은 것 — 에러로 보여 주지 않는다
    case 'auth/unauthorized-domain':
      return '이 주소는 로그인 허용 목록에 없어요. Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 지금 주소를 추가해 주세요.';
    case 'auth/network-request-failed':
      return '인터넷에 연결되지 않았어요. 연결을 확인한 뒤 다시 눌러 주세요.';
    case 'auth/operation-not-allowed':
      return 'Google 로그인이 꺼져 있어요. Firebase 콘솔 → Authentication → 로그인 방법에서 Google을 사용 설정해 주세요.';
    default:
      return `로그인하지 못했어요. (${code || '알 수 없는 오류'})`;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    // 리다이렉트 방식으로 로그인하고 돌아온 경우의 결과(에러) 처리
    getRedirectResult(auth).catch((e) => setError(authMessage(e)));
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!auth) return;
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // 홈 화면에 설치한 앱·휴대폰에서는 팝업이 막히기 쉬워 페이지 이동(리다이렉트) 방식을 쓴다.
      if (isStandalone() || isMobileDevice()) await signInWithRedirect(auth, provider);
      else await signInWithPopup(auth, provider);
    } catch (e) {
      const code = errorCode(e);
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      setError(authMessage(e));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
  }, []);

  return { user, ready, error, signIn, signOut };
}
