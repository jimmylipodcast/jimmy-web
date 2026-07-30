'use client';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import CategoryManager from './CategoryManager';

interface AdminPanelProps {
  categories: string[];
  onAddCourse: (course: any, files?: { imageFile?: File; pdfFiles?: File[] }) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onReorderCategories: (orderedNames: string[]) => void;
  onLogout: () => void;
}

export default function AdminControlPanel({
  categories,
  onAddCourse,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories,
  onLogout
}: AdminPanelProps) {
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState(categories[0] || '化學高一');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddCourse({
      id: 'course-' + Date.now(),
      title: title.trim(),
      courseName,
      content: content.trim() || '無詳細內容描述。',
      videoUrl: videoUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
      isPinned
    }, {
      imageFile: imageFile || undefined,
      pdfFiles: pdfFiles.length > 0 ? pdfFiles : undefined
    });

    setTitle('');
    setContent('');
    setVideoUrl('');
    setIsPinned(false);
    setImageFile(null);
    setPdfFiles([]);
    setFileInputKey(Date.now());
    alert('✨ 部落格新文章發布成功！已依時間自動排序。');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="font-bold text-slate-800 text-base">🛠 老師專屬後台管理控制台</h3>
        <button
          onClick={onLogout}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition font-medium"
        >
          安全登出系統
        </button>
      </div>

      <CategoryManager
        categories={categories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
        onReorderCategories={onReorderCategories}
      />

      {/* 發布新文章講義 */}
      <form onSubmit={handleCourseSubmit} className="space-y-4">
        <h4 className="text-xs font-bold text-slate-600">📄 新增部落格文章 / 影片講義</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500">文章標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 1-5 物質的形成"
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
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
            🖼 上傳圖片檔案（選填，可與影片/PDF同時使用）
          </label>
          <input
            key={`img-${fileInputKey}`}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
            className="border border-dashed border-slate-300 p-2 rounded-xl text-xs bg-slate-50/40 text-slate-600 focus:outline-indigo-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-500">YouTube 影片網址（選填，可與圖片/PDF同時使用）</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="請輸入 YouTube 影片網址"
            className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            📎 上傳 PDF 講義檔案（可一次選取多個，選填）
          </label>
          <input
            key={`pdf-${fileInputKey}`}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setPdfFiles(Array.from(e.target.files));
              }
            }}
            className="border border-dashed border-indigo-200 p-2 rounded-xl text-xs bg-indigo-50/20 text-slate-600 focus:outline-indigo-500 cursor-pointer"
          />
          {pdfFiles.length > 0 && (
            <p className="text-[11px] text-slate-400 pt-0.5">
              已選取 {pdfFiles.length} 個檔案：{pdfFiles.map(f => f.name).join('、')}
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-500">文章詳細內容說明</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="請輸入文案內容..." />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="font-semibold text-slate-600">📌 強制將此文案置頂於公告欄</span>
          </label>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
          >
            發布文案講義
          </button>
        </div>
      </form>
    </div>
  );
}