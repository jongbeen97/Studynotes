import { useEffect, useState } from 'react';
import type { ProfileRepository } from './repository/ProfileRepository';
import { emptyProfile, type Profile } from './types';

interface ProfileState {
  profile: Profile;
  loaded: boolean;
  error: string | null;
}

/** 내 정보를 실시간으로 받아 온다 */
export function useProfile(repo: ProfileRepository): ProfileState {
  const [state, setState] = useState<ProfileState>({ profile: emptyProfile(), loaded: false, error: null });

  useEffect(() => {
    setState((s) => ({ ...s, loaded: false, error: null }));
    return repo.subscribe(
      (profile) => setState({ profile, loaded: true, error: null }),
      (err) => setState((s) => ({ ...s, loaded: true, error: err.message || '내 정보를 불러오지 못했어요.' })),
    );
  }, [repo]);

  return state;
}
