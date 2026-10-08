import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

/*
 * 아이디(이메일)·비밀번호 로그인.
 * 비밀번호는 앱 DB(Firestore)에 저장하지 않고 Firebase Authentication이 암호화해서 보관한다.
 * (Spring Security가 비밀번호를 해시로만 저장하는 것과 같은 이유)
 */

export const PASSWORD_MIN = 8;

function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
}

export function accountErrorMessage(e: unknown): string {
  switch (errorCode(e)) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return '아이디 또는 비밀번호가 맞지 않아요.';
    case 'auth/too-many-requests':
      return '시도가 너무 많아 잠시 막혔어요. 몇 분 뒤 다시 해 주세요.';
    case 'auth/weak-password':
      return `비밀번호는 ${PASSWORD_MIN}자 이상으로 정해 주세요.`;
    case 'auth/requires-recent-login':
      return '보안을 위해 로그아웃한 뒤 다시 로그인하고 한 번 더 시도해 주세요.';
    case 'auth/provider-already-linked':
    case 'auth/credential-already-in-use':
    case 'auth/email-already-in-use':
      return '이미 비밀번호가 설정된 계정이에요. 화면을 새로 고친 뒤 ‘비밀번호 변경’을 이용해 주세요.';
    case 'auth/operation-not-allowed':
      return '비밀번호 로그인이 꺼져 있어요. Firebase 콘솔 → Authentication → 로그인 방법에서 ‘이메일/비밀번호’를 사용 설정해 주세요.';
    case 'auth/network-request-failed':
      return '인터넷에 연결되지 않았어요. 연결을 확인한 뒤 다시 해 주세요.';
    default:
      return `처리하지 못했어요. (${errorCode(e) || '알 수 없는 오류'})`;
  }
}

/** 이 계정에 비밀번호 로그인이 연결되어 있는지 */
export const hasPassword = (user: User): boolean => user.providerData.some((p) => p.providerId === 'password');

/** 로그인 방법 이름 (화면 표시용) */
export function signInMethods(user: User): string {
  const names = user.providerData.map((p) => (p.providerId === 'google.com' ? 'Google' : p.providerId === 'password' ? '아이디·비밀번호' : p.providerId));
  return names.join(' + ') || '알 수 없음';
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('Firebase 설정 전에는 로그인할 수 없어요.');
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function sendResetMail(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase 설정 전에는 쓸 수 없어요.');
  await sendPasswordResetEmail(auth, email.trim());
}

/** Google로 만든 계정에 비밀번호를 처음 정한다 → 다음부터 아이디(이메일)·비밀번호로도 로그인 */
export async function addPassword(user: User, password: string): Promise<void> {
  if (!user.email) throw new Error('이메일이 없는 계정이에요.');
  await linkWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

/** 지금 비밀번호를 확인한 뒤 새 비밀번호로 바꾼다 */
export async function changePassword(user: User, current: string, next: string): Promise<void> {
  if (!user.email) throw new Error('이메일이 없는 계정이에요.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
  await updatePassword(user, next);
}
