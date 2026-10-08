import type { Profile, ProfileInput } from '../types';

/** 내 정보 저장소. 한 사람당 문서 하나 */
export interface ProfileRepository {
  subscribe(onChange: (profile: Profile) => void, onError: (err: Error) => void): () => void;
  /** 넘긴 칸만 바꾸고 나머지는 그대로 둔다 */
  update(input: ProfileInput): Promise<void>;
}
