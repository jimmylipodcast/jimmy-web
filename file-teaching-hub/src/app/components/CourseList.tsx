'use client';
import { useState } from 'react';

interface Course {
  id: string;
  title: string;
  courseName: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  pdfUrls?: string[];
  createdAt: string;
  isPinned: boolean;
}

interface CourseListProps {
  courses: Course[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

// 輔助函式：處理 YouTube 嵌入連結
function getEmbedYoutubeUrl(url: string) {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/watch')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function CourseCard({ course, isAdmin, onDelete, onTogglePin }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const embedYoutube = getEmbedYoutubeUrl(course.videoUrl || '');
  const shouldTruncate = course.content.length > 120;
  const displayedContent = (shouldTruncate && !isExpanded) ? `${course.content.substring(0, 120)}...` : course.content;

  return (
    <article
      id={`course-card-${course.id}`}
      className="bg-white p-7 rounded-3xl border border-slate-100/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
    >
      <div className="flex items-center justify-between text-xs text-slate-400 font-bold tracking-wide mb-3">
        <div className="flex items-center space-x-3">
          <time className="text-slate-400/90 font-medium">
            {new Date(course.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <span className="text-slate-300">|</span>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-black tracking-wider">{course.courseName}</span>
          {course.isPinned && (
            <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold">☆重點置頂</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-black text-slate-800 text-lg md:text-xl leading-snug">{course.title}</h3>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{displayedContent}</p>
        {shouldTruncate && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition pt-1 block">
            {isExpanded ? '▲收合文章' : '▼閱讀全文...'}
          </button>
        )}
      </div>

      {/* ✅ 圖片：獨立區塊，只要有 imageUrl 就顯示 */}
      {course.imageUrl && (
        <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <img src={course.imageUrl} alt={course.title} className="w-full h-auto object-cover" />
        </div>
      )}

      {/* ✅ YouTube 影片：獨立區塊，只要有 videoUrl 就顯示 */}
      {embedYoutube && (
        <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <div className="relative aspect-video w-full">
            <iframe src={embedYoutube} className="absolute inset-0 w-full h-full" allowFullScreen />
          </div>
        </div>
      )}

      {/* ✅ PDF 講義下載：支援同時顯示多個檔案 */}
      {course.pdfUrls && course.pdfUrls.length > 0 && (
        <div className="mt-4 space-y-2">
          {course.pdfUrls.map((url: string, idx: number) => (
            <div
              key={idx}
              className="p-4 bg-slate-50/50 flex items-center justify-between gap-4 border-l-4 border-indigo-500 rounded-2xl border border-slate-100"
            >
              <p className="text-xs font-bold text-slate-700 truncate">
                {course.title} - 課程講義{course.pdfUrls.length > 1 ? `（${idx + 1}）` : ''}
              </p>
              
                href={url}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap"
              >
                打開講義 ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={() => onTogglePin(course.id)} className={`text-xs font-bold px-3 py-2 rounded-xl transition ${course.isPinned ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            {course.isPinned ? '取消置頂' : '設為置頂'}
          </button>
          <button onClick={() => { if(confirm('確定要刪除嗎？')) onDelete(course.id); }} className="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition">
            刪除文章
          </button>
        </div>
      )}
    </article>
  );
}

export default function CourseList({ courses, isAdmin, onDelete, onTogglePin }: CourseListProps) {
  if (!courses || courses.length === 0) {
    return <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 font-bold">目前沒有發布的文章。</div>;
  }
  return (
    <div className="space-y-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}