import { supabase } from '../../utils/supabase';
import { ToolFile, mimeFromPath } from './toolTypes';

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function serveTool(
  request: Request,
  id: string,
  segments: string[],
  baseHref: string
) {
  const { data: tool, error } = await supabase
    .from('tools')
    .select('entry_path, files')
    .eq('id', id)
    .maybeSingle();

  if (error || !tool) return new Response('Not found', { status: 404 });

  // 只提供「清單裡有記錄」的檔案，清單只有登入的老師寫得進去
  const files = (tool.files || []) as ToolFile[];
  const joined = segments.join('/');
  const requested = joined ? safeDecode(joined) : tool.entry_path;
  const file = files.find((f) => f.path === requested || f.path === joined);
  if (!file) return new Response('Not found', { status: 404 });

  const etag = `"${file.hash}"`;
  const cacheHeaders = {
    ETag: etag,
    'Cache-Control': 'public, max-age=0, must-revalidate',
  };

  const ifNoneMatch = (request.headers.get('if-none-match') || '').replace(/^W\//, '');
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  const { data: urlData } = supabase.storage.from('tools').getPublicUrl(file.key);
  const upstream = await fetch(urlData.publicUrl, { cache: 'no-store' });
  if (!upstream.ok) return new Response('File unavailable', { status: 502 });

  const type = file.type || mimeFromPath(file.path);
  const headers = {
    ...cacheHeaders,
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
  };

  if (type.startsWith('text/html')) {
    let html = await upstream.text();
    // 加上 <base>，讓 app.js、brand-logo.png 這類相對路徑不論網址有沒有結尾斜線都正確
    const baseTag = `<base href="${baseHref}">`;
    const headOpen = /<head(\s[^>]*)?>/i;
    html = headOpen.test(html)
      ? html.replace(headOpen, (m) => m + baseTag)
      : baseTag + html;
    return new Response(html, { headers });
  }

  return new Response(await upstream.arrayBuffer(), { headers });
}