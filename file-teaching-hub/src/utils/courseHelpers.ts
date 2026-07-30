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