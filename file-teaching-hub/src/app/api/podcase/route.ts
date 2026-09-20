import { NextResponse } from 'next/server';

const RSS_URL = 'https://feeds.soundon.fm/podcasts/297160a7-85b1-4913-b7ab-aea140ef52a6.xml';

// 從 XML 片段中取出指定標籤的內容，自動處理 CDATA 包裹
function extractTag(source: string, tag: string): string {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`);
  const match = source.match(regex);
  return match ? match[1].trim() : '';
}

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      // 每小時重新抓取一次，避免每個訪客都即時打 SoundOn，減輕負擔
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: '無法取得 Podcast RSS' }, { status: 502 });
    }

    const xml = await res.text();

    // 取出第一個 <item>...</item>，也就是最新一集
    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) {
      return NextResponse.json({ error: '找不到任何集數' }, { status: 404 });
    }

    const itemXml = itemMatch[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');

    const imageMatch = itemXml.match(/<itunes:image href="([^"]+)"/);
    const image = imageMatch ? imageMatch[1] : '';

    return NextResponse.json({
      title,
      link,
      pubDate,
      image
    });
  } catch (error) {
    console.error('讀取 Podcast RSS 失敗:', error);
    return NextResponse.json({ error: '伺服器發生錯誤' }, { status: 500 });
  }
}