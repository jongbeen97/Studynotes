import { useState, type FormEvent } from 'react';
import { accountErrorMessage, sendResetMail, signInWithPassword } from '../lib/account';
import { APP_NAME, STORAGE_KEYS } from '../lib/constants';
import { isAppleTouchDevice, isStandalone, storageGet, storageSet } from '../lib/platform';

/** 로그인 전 첫 화면: 아이디(이메일)·비밀번호 또는 Google */
export function LoginScreen({ onSignIn, error }: { onSignIn: () => void; error: string | null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!email.trim() || !password) return setStatus({ ok: false, text: '아이디와 비밀번호를 모두 적어 주세요.' });
    setBusy(true);
    setStatus(null);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setStatus({ ok: false, text: accountErrorMessage(err) });
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) return setStatus({ ok: false, text: '아이디(이메일)를 먼저 적어 주세요.' });
    try {
      await sendResetMail(email);
      setStatus({ ok: true, text: '비밀번호를 다시 정하는 메일을 보냈어요. 메일함을 확인해 주세요.' });
    } catch (err) {
      setStatus({ ok: false, text: accountErrorMessage(err) });
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <h1>{APP_NAME}</h1>
        <p>하루 한 장 배운 것을 기록하고, 일정을 챙기고, 다음 날과 일주일 뒤에 다시 봅니다.</p>

        <form className="form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="login-id">아이디 (이메일)</label>
            <input id="login-id" className="input" type="email" autoComplete="username" value={email} onChange={(ev) => setEmail(ev.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-pw">비밀번호</label>
            <input id="login-pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(ev) => setPassword(ev.target.value)} />
          </div>
          <button type="submit" className="btn primary big" disabled={busy}>
            {busy ? '로그인 중…' : '로그인'}
          </button>
          <button type="button" className="linkish note" onClick={reset}>
            비밀번호를 잊으셨나요?
          </button>
        </form>
        {status && (
          <p className={`status${status.ok ? '' : ' error'}`} role={status.ok ? 'status' : 'alert'}>
            {status.text}
          </p>
        )}

        <div className="or" aria-hidden="true">
          또는
        </div>
        <button type="button" className="btn big" onClick={onSignIn}>
          Google 계정으로 계속하기
        </button>
        {error && (
          <p className="status error" role="alert">
            {error}
          </p>
        )}
        <p className="note">처음에는 Google로 로그인한 뒤 ‘내 정보’에서 비밀번호를 정하면, 다음부터 아이디·비밀번호로도 들어올 수 있어요.</p>
      </div>
    </div>
  );
}

/** 로딩 중 */
export function Splash({ text = '불러오는 중…' }: { text?: string }) {
  return (
    <div className="login">
      <p className="note">{text}</p>
    </div>
  );
}

/** iPhone·iPad Safari에서 "홈 화면에 추가" 안내 (설치 후에는 보이지 않음) */
export function InstallHint() {
  const [hidden, setHidden] = useState(
    () => !isAppleTouchDevice() || isStandalone() || storageGet(STORAGE_KEYS.installHintDismissed) === '1',
  );
  if (hidden) return null;
  return (
    <div className="banner">
      <span>
        <b>앱처럼 쓰기:</b> Safari의 공유 버튼(네모에서 화살표가 나오는 모양)을 누르고 ‘홈 화면에 추가’를 고르세요.
      </span>
      <button
        type="button"
        className="btn small"
        onClick={() => {
          storageSet(STORAGE_KEYS.installHintDismissed, '1');
          setHidden(true);
        }}
      >
        닫기
      </button>
    </div>
  );
}
