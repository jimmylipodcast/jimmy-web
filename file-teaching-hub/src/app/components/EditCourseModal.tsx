'use client';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { normalizeContentHtml, getFileNameFromUrl } from '../../utils/courseHelpers';
import { Course } from '../lib/types';

interface EditCourseModalProps {
  course: Course;
  categories: string[];
  onClose: () => void;
  onUpdate: (
    id: string,
    fields: {
      title: string;
      courseName: string;
      content: string;
      videoUrl?: string;
      isPinned: boolean;
      removeImage?: boolean;
      keptPdfUrls: string[];
      keptPdfNames: string[];
    },
    files?: { imageFile?: File; pdfFiles?: File[] }
  ) => Promise<void>;
}

export default function EditCourseModal({ course, categories, onClose, onUpdate }: EditCourseModalProps) {
  const [title, setTitle] = useState(course.title);
  const [courseName, setCourseName] = useState(course.courseName);
  const [content, setContent] = useState(normalizeContentHtml(course.content));
  const [videoUrl, setVideoUrl] = useState(course.videoUrl || '');
  const [isPinned, setIsPinned] = useState(course.isPinned);

  const [currentImageUrl, setCurrentImageUrl] = useState(course.imageUrl || '');
  const [removeImage, setRemoveImage] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  // ✅ 網址與名稱綁成一組物件陣列，一起增刪，不會脫鉤
  const [keptPdfs, setKeptPdfs] = useState<{ url: string; name: string }[]>(
    (course.pdfUrls || []).map((url, idx) => ({
      url,
      name: course.pdfNames?.[idx] || getFileNameFromUrl(url)
    }))
  );
  const [newPdfFiles, setNewPdfFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemoveExistingPdf = (index: number) => {
    setKeptPdfs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImageFile(e.target.files[0]);
      setRemoveImage(false);
    }
  };

  const handleRemoveImageClick = () => {
    setCurrentImageUrl('');
    setNewImageFile(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdate(
        course.id,
        {
          title: title.trim(),
          courseName,
          content,
          videoUrl: videoUrl.trim() || undefined,
          isPinned,
          removeImage,
          keptPdfUrls: keptPdfs.map((p) => p.url),
          keptPdfNames: keptPdfs.map((p) => p.name)
        },
        {
          imageFile: newImageFile || undefined,
          pdfFiles: newPdfFiles.length > 0 ? newPdfFiles : undefined
        }
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 p-5 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-base">編輯文章</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">文章標題</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">選取課程分類</label>
              <select
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 圖片 */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-500">文章圖片</label>
            {currentImageUrl && !removeImage && !newImageFile && (
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl">
                <img src={currentImageUrl} alt="目前圖片" className="w-16 h-16 object-cover rounded-lg" />
                <span className="text-[11px] text-slate-400 flex-1">目前使用的圖片</span>
                <button
                  type="button"
                  onClick={handleRemoveImageClick}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md"
                >
                  移除圖片
                </button>
              </div>
            )}
            {newImageFile && (
              <div className="flex items-center gap-3 bg-indigo-50 p-2 rounded-xl">
                <span className="text-[11px] text-indigo-600 flex-1">將更換為新圖片：{newImageFile.name}</span>
                <button
                  type="button"
                  onClick={() => setNewImageFile(null)}
                  className="text-xs font-bold text-slate-500 hover:bg-white px-2 py-1 rounded-md"
                >
                  取消更換
                </button>
              </div>
            )}
            {removeImage && !newImageFile && (
              <p className="text-[11px] text-red-500">儲存後將移除目前圖片</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="border border-dashed border-slate-300 p-2 rounded-xl text-xs bg-slate-50/40 text-slate-600 focus:outline-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">選取新檔案即可取代原本的圖片，不選則維持原狀</p>
          </div>

          {/* YouTube 網址 */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500">YouTube 影片網址（選填）</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="請輸入 YouTube 影片網址"
              className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
            />
          </div>

          {/* PDF 清單 */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-indigo-600">PDF 講義檔案</label>
            {keptPdfs.length > 0 && (
              <div className="space-y-1.5">
                {keptPdfs.map((pdf, index) => (
                  <div key={pdf.url} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                    <a href={pdf.url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 font-bold truncate flex-1">
                      {pdf.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPdf(index)}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md ml-2"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => {
                if (e.target.files) setNewPdfFiles(Array.from(e.target.files));
              }}
              className="border border-dashed border-indigo-200 p-2 rounded-xl text-xs bg-indigo-50/20 text-slate-600 focus:outline-indigo-500 cursor-pointer"
            />
            {newPdfFiles.length > 0 && (
              <p className="text-[11px] text-slate-400">
                將新增 {newPdfFiles.length} 個檔案：{newPdfFiles.map((f) => f.name).join('、')}
              </p>
            )}
            <p className="text-[11px] text-slate-400">新選取的檔案會加進現有清單，不會覆蓋；要拿掉舊檔案請按「移除」</p>
          </div>

          {/* 內文編輯器 */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500">文章詳細內容說明</label>
            <RichTextEditor value={content} onChange={setContent} placeholder="請輸入文案內容..." />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="font-semibold text-slate-600">強制將此文案置頂於公告欄</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
              >
                {isSubmitting ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}