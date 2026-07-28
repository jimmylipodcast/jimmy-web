'use client';

export default function PodcastWidget() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
        🎙️ 音頻與社群專區
      </h4>
      
      {/* 1. Spotify 區塊 */}
      <div className="bg-emerald-50/50 p-4 rounded-xl space-y-2 border border-emerald-100">
        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">SPOTIFY PODCAST</span>
        <h5 className="text-xs font-bold text-slate-800">吉米師的化學事 Podcast</h5>
        <a 
          href="https://open.spotify.com/show/6SuMxMw3uT5jVa88pPscQl?si=1f2006b8c35f444d" target="_blank" rel="noopener noreferrer"
          className="block text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl transition"
        >
          立即前往收聽 →
        </a>
      </div>

      {/* 2. YouTube 頻道區塊（改為與 Spotify 相同大小及排版） */}
      <div className="bg-red-50/50 p-4 rounded-xl space-y-2 border border-red-100">
        <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">YOUTUBE CHANNEL</span>
        <h5 className="text-xs font-bold text-slate-800">吉米師的化學事頻道</h5>
        <a 
          href="https://www.youtube.com/@teacher_jimmy" target="_blank" rel="noopener noreferrer"
          className="block text-center bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 rounded-xl transition"
        >
          立即訂閱頻道 →
        </a>
      </div>

      {/* 3. 底部社群超連結入口（原 YouTube 按鈕改為 Facebook） */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <a 
          href="https://www.facebook.com/share/18z8nGgN3k/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 p-2.5 rounded-xl text-xs font-bold transition"
        >
          📘 Facebook 專頁
        </a>
        <a 
          href="https://www.instagram.com/teacherjimmypodcast/" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100 p-2.5 rounded-xl text-xs font-bold transition"
        >
          📸 Instagram 追蹤
        </a>
      </div>
    </div>
  );
}