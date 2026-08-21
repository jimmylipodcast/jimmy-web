// 輔助函式：處理 YouTube 嵌入連結
export function getEmbedYoutubeUrl(url: string) {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/watch')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url;
  }
  return videoId ? 'https://www.youtube.com/embed/' + videoId : null;
}

// 自動偵測純文字中的網址，轉換成可點擊、有顏色的超連結（略過本來就已經是 <a> 標籤的部分）
export function linkifyHtml(html: string): string {
  if (!html) return html;
  const urlRegex = /((https?:\/\/)[^\s<]+)/g;
  const parts = html.split(/(<[^>]+>)/g);
  let insideAnchor = false;

  return parts
    .map((part) => {
      if (part.startsWith('<')) {
        const tagLower = part.toLowerCase();
        if (tagLower.startsWith('<a')) insideAnchor = true;
        if (tagLower.startsWith('</a')) insideAnchor = false;
        return part;
      }
      if (insideAnchor) return part;

      return part.replace(urlRegex, (match) => {
        let url = match;
        let trailing = '';
        const trailingChars = ['.', ',', ')', '，', '。', '！', '？'];
        while (url.length > 0 && trailingChars.includes(url[url.length - 1])) {
          trailing = url[url.length - 1] + trailing;
          url = url.slice(0, -1);
        }
        return (
          '<a href="' +
          url +
          '" target="_blank" rel="noreferrer" style="color:#4f46e5; text-decoration: underline; font-weight: 600;">' +
          url +
          '</a>' +
          trailing
        );
      });
    })
    .join('');
}

// 將裸露的換行字元（\n）轉成 <br/>，不論內容是純文字或已含 HTML 樣式標籤都適用
// 只逃逸「不在標籤內」的特殊符號，避免破壞既有的 HTML 標籤與樣式
export function normalizeContentHtml(content: string): string {
  if (!content) return content;

  const hasBlockElements = /<(div|p|br)\b/i.test(content);
  if (hasBlockElements) {
    // 已經有真正的換行相關標籤（代表是用編輯器正常換行發布的），不用再處理
    return content;
  }

  // 沒有換行標籤的情況：可能是純文字舊文章，也可能是「只有樣式、沒換行」的內容
  // 兩種情況都只需要把 \n 轉成 <br/>，不會動到既有的樣式標籤（如 <span style="color:...">）
  return content.replace(/\n/g, '<br/>');
}

// 從 Supabase Storage 的公開網址中，還原出使用者上傳時的原始檔名
export function getFileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    const fileNameWithPrefix = decoded.split('/').pop() || '課程講義.pdf';
    // 檔名格式是「時間戳-隨機碼-原始檔名」，這裡把前面兩段前綴去掉，只留原始檔名
    const parts = fileNameWithPrefix.split('-');
    if (parts.length > 2) {
      return parts.slice(2).join('-');
    }
    return fileNameWithPrefix;
  } catch {
    return '課程講義.pdf';
  }
}