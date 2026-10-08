/** 홈 화면에 설치된 앱으로 실행 중인지 */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true;
}

/** iPhone·iPad (iPadOS는 데스크톱처럼 'Macintosh'로 보이므로 터치 지점 수로 구분) */
export function isAppleTouchDevice(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isMobileDevice(): boolean {
  return isAppleTouchDevice() || /Android/i.test(navigator.userAgent);
}

/** 클립보드 복사. 막혀 있으면 false */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 예전 방식으로 한 번 더 시도
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** localStorage 읽기·쓰기 (사생활 보호 모드 등에서 막혀도 앱이 멈추지 않게) */
export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 무시 */
  }
}
export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}
