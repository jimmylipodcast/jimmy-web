export interface ToolFile {
  path: string;
  key: string;
  hash: string;
  type: string;
  size: number;
}

// 單一檔案上限：Vercel 免費方案單次回應約 4.5MB，留一點餘裕
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
};

export function extOf(path: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(path);
  return match ? match[1].toLowerCase() : '';
}

export function mimeFromPath(path: string): string {
  return MIME[extOf(path)] || 'application/octet-stream';
}