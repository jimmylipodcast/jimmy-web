'use client';
import { useState } from 'react';

interface AdminPanelProps {
  categories: string[];
  // 💡 onAddCourse 現在多帶一個 imageFile 參數
  onAddCourse: (course: any, files?: { imageFile?: File; pdfFile?: File }) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onLogout: () => void;
}

export default function AdminControlPanel({
  categories,
  onAddCourse,
  onAddCategory,
  onDeleteCategory,
  onLogout
}: AdminPanelProps) {
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState(categories[0] || '化學高一');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 📎 圖片與 PDF 都改為檔案狀態
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // 🔄 用於發布成功後，強制重置歸零 file input 欄位狀態
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
    }, { imageFile: imageFile || undefined, pdfFile: pdfFile || undefined });

    // 表單清空重置
    setTitle('');
    setContent('');
    setVideoUrl('');
    setIsPinned(false);
    setImageFile(null);
    setPdfFile(null);
    setFileInputKey(Date.now()); // 刷新 key 讓兩個檔案選取器一起清空
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

      {/* 目錄分類管理 */}
      <div className="bg-slate-50 p-4 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-slate-600">📁 管理目錄分類</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="新增自訂分類名稱 (例如: 化學高三)"
            className="border bg-white border-slate-200 p-2 rounded-xl text-xs flex-1 focus:outline-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              onAddCategory(newCatName);
              setNewCatName('');
            }}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700"
          >
            新增分類
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map(cat => (
            <span key={cat} className="inline-flex items-center gap-1.5 bg-white border px-2.5 py-1 rounded-lg text-xs text-slate-600 font-medium">
              {cat}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`確定刪換 ${cat} 分類？`)) onDeleteCategory(cat);
                }}
                className="text-red-400 hover:text-red-600 font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

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

        {/* ✅ 圖片：改成從電腦上傳 */}
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

        {/* YouTube 影片網址：維持文字輸入即可，網址本身就很短 */}
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

        {/* 📎 PDF 講義上傳區塊 */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            📎 上傳 PDF 講義檔案（選填，可與圖片/影片同時使用）
          </label>
          <input
            key={`pdf-${fileInputKey}`}
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setPdfFile(e.target.files[0]);
              }
            }}
            className="border border-dashed border-indigo-200 p-2 rounded-xl text-xs bg-indigo-50/20 text-slate-600 focus:outline-indigo-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-500">文章詳細內容說明</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="請輸入文案內容..."
            className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
          />
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