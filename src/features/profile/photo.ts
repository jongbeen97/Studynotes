import { PHOTO_MAX_CHARS } from './types';

const SIZE = 256; // 가로세로 256px 정사각형으로 줄인다

/**
 * 고른 사진을 가운데 기준 정사각형으로 잘라 작은 JPEG(data URL)로 만든다.
 * 원본(수 MB)을 그대로 올리지 않아 무료 요금제 한도 안에서 저장할 수 있다.
 */
export async function photoToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 올릴 수 있어요.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('사진을 읽지 못했어요. JPG나 PNG 파일로 다시 골라 주세요.'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이 브라우저에서는 사진을 줄일 수 없어요.');
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    for (const quality of [0.85, 0.7, 0.5]) {
      const data = canvas.toDataURL('image/jpeg', quality);
      if (data.length <= PHOTO_MAX_CHARS) return data;
    }
    throw new Error('사진이 너무 커요. 다른 사진을 골라 주세요.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
