import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { authDomain, firebaseEnabled } from './shared/lib/firebase';
import './styles/index.css';

/*
 * Firebase Hosting은 같은 앱을 두 주소로 보여 준다: <프로젝트>.web.app 과 <프로젝트>.firebaseapp.com
 * Safari(iPhone·iPad·Mac)는 로그인 주소(authDomain)와 앱 주소가 다르면 Google 로그인이 막히므로,
 * web.app 으로 들어오면 firebaseapp.com 으로 옮겨 준다.
 */
function needsAuthDomainRedirect(): boolean {
  if (!firebaseEnabled || !authDomain.endsWith('.firebaseapp.com')) return false;
  const project = authDomain.replace(/\.firebaseapp\.com$/, '');
  return location.hostname === `${project}.web.app`;
}

if (needsAuthDomainRedirect()) {
  location.replace(`https://${authDomain}${location.pathname}${location.search}${location.hash}`);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
