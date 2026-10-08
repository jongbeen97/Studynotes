import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

/*
 * Firebase 연결.
 * .env.local 에 값이 모두 있으면 Firebase(로그인 + 클라우드 저장)를 쓰고,
 * 비어 있으면 firebaseEnabled = false 가 되어 "이 기기에만 저장" 모드로 동작한다.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
export const authDomain = config.authDomain ?? '';

let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseEnabled) {
  const app = initializeApp(config);
  auth = getAuth(app);
  // 오프라인에서도 읽고 쓸 수 있도록 기기에 캐시를 둔다. 인터넷이 돌아오면 자동으로 올라간다.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

export { auth, db };
