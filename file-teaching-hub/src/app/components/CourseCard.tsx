'use client';
import { useState } from 'react';
import EditCourseModal from './EditCourseModal';
import { getEmbedYoutubeUrl, linkifyHtml, normalizeContentHtml, getFileNameFromUrl } from '../../utils/courseHelpers';
interface CourseCardProps {
  course: any;
  categories: string[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onUpdate: (id: string, fields: any, files?: any) => Promise<void>;
}

// 兩段式刪除確認按鈕：第一次點擊進入警示狀態，3 秒內再點一次才會真的刪除
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onDelete();
    setConfirming(false);
  };

  const btnClass = confirming
    ? 'text-xs font-bold px-4 py-2 rounded-xl transition bg-red-600 text-white animate-pulse'
    : 'text-xs font-bold px-4 py-2 rounded-xl transition text-red-500 bg-red-50 hover:bg-red-500 hover:text-white';

  return (
    <button onClick={handleClick} className={btnClass}>
      {confirming ? '再點一次確認刪除' : '刪除文章'}
    </button>
  );
}

export default function CourseCard({ course, categories, isAdmin, onDelete, onTogglePin, onUpdate }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const embedYoutube = getEmbedYoutubeUrl(course.videoUrl || '');

  return (
    <>
      <article
        id={'course-card-' + course.id}
        className="bg-white p-7 rounded-3xl border border-slate-100/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold tracking-wide mb-3">
          <div className="flex items-center space-x-3">
            <time className="text-slate-400/90 font-medium">
              {new Date(course.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <span className="text-slate-300">|</span>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-black tracking-wider">{course.courseName}</span>
            {course.isPinned && (
              <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold">重點置頂</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-800 text-lg md:text-xl leading-snug">{course.title}</h3>
          <div
            className={
              'course-content text-slate-600 text-sm md:text-base leading-relaxed break-words ' +
              (isExpanded ? '' : 'line-clamp-4')
            }
            dangerouslySetInnerHTML={{ __html: linkifyHtml(normalizeContentHtml(course.content)) }}
          />
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition pt-1 block">
            {isExpanded ? '收合文章' : '閱讀全文...'}
          </button>
        </div>

        {course.imageUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <img src={course.imageUrl} alt={course.title} className="w-full h-auto object-cover" />
          </div>
        )}

        {embedYoutube && (
          <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className="relative aspect-video w-full">
              <iframe src={embedYoutube} className="absolute inset-0 w-full h-full" allowFullScreen />
            </div>
          </div>
        )}

      {course.pdfUrls && course.pdfUrls.length > 0 && (
        <div className="mt-4 space-y-2">
          {course.pdfUrls.map((url: string, idx: number) => {
            const label = getFileNameFromUrl(url);
            return (
              <div
                key={idx}
                className="p-4 bg-slate-50/50 flex items-center justify-between gap-4 border-l-4 border-indigo-500 rounded-2xl border border-slate-100"
              >
                <p className="text-xs font-bold text-slate-700 truncate">{label}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap"
                >
                  打開講義
                </a>
              </div>
            );
          })}
        </div>
      )}

        {isAdmin && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold px-3 py-2 rounded-xl transition bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            >
              編輯
            </button>
            <button
              onClick={() => onTogglePin(course.id)}
              className={
                'text-xs font-bold px-3 py-2 rounded-xl transition ' +
                (course.isPinned ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600')
              }
            >
              {course.isPinned ? '取消置頂' : '設為置頂'}
            </button>
            <DeleteButton onDelete={() => onDelete(course.id)} />
          </div>
        )}
      </article>

      {isEditing && (
        <EditCourseModal
          course={course}
          categories={categories}
          onClose={() => setIsEditing(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}