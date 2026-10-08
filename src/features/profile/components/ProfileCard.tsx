import { useRef, useState, type ChangeEvent } from 'react';
import { photoToDataUrl } from '../photo';
import type { Profile } from '../types';
import { Avatar } from './Avatar';

interface Props {
  profile: Profile;
  account: string | null; // 로그인 아이디(이메일)
  methods: string | null; // 로그인 방법
  onPhoto: (photo: string) => void;
  onNickname: (nickname: string) => void;
}

/** 사진, 표시 이름, 아이디 */
export function ProfileCard({ profile, account, methods, onPhoto, onNickname }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [nickname, setNickname] = useState(profile.nickname);
  const [busy, setBusy] = useState(false);

  const pick = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus('');
    try {
      onPhoto(await photoToDataUrl(file));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '사진을 올리지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel profile-card" aria-label="프로필">
      <div className="profile-photo">
        <Avatar photo={profile.photo} name={profile.nickname || account || ''} size="lg" />
        <div className="row">
          <button type="button" className="btn small" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? '줄이는 중…' : profile.photo ? '사진 바꾸기' : '사진 올리기'}
          </button>
          {profile.photo && (
            <button type="button" className="btn small danger" onClick={() => onPhoto('')}>
              지우기
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
        </div>
        {status && (
          <p className="status error" role="alert">
            {status}
          </p>
        )}
      </div>

      <dl className="profile-facts">
        <dt>아이디</dt>
        <dd className="mono">{account ?? '로그인 없이 이 기기에서 사용 중'}</dd>
        {methods && (
          <>
            <dt>로그인 방법</dt>
            <dd>{methods}</dd>
          </>
        )}
        <dt>
          <label htmlFor="p-nickname">표시 이름</label>
        </dt>
        <dd>
          <form
            className="inline-form"
            onSubmit={(ev) => {
              ev.preventDefault();
              onNickname(nickname.trim());
            }}
          >
            <input id="p-nickname" className="input" maxLength={40} placeholder="예: 개발자 이름" value={nickname} onChange={(ev) => setNickname(ev.target.value)} />
            <button type="submit" className="btn small" disabled={nickname.trim() === profile.nickname}>
              저장
            </button>
          </form>
        </dd>
      </dl>
    </section>
  );
}
