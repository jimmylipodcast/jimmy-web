'use client';
import { useState } from 'react';

interface CategoryManagerProps {
  categories: string[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onReorderCategories: (orderedNames: string[]) => void;
}

export default function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories
}: CategoryManagerProps) {
  const [newCatName, setNewCatName] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const newList = [...categories];
    const [moved] = newList.splice(dragIndex, 1);
    newList.splice(index, 0, moved);
    onReorderCategories(newList);
    setDragIndex(null);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
      <h4 className="text-sm font-bold text-slate-600">📁 管理目錄分類（可拖曳調整順序）</h4>
      <div className="flex gap-2">
        <input
          type="text"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="新增自訂分類名稱 (例如: 化學高三)"
          className="border bg-white border-slate-200 p-2.5 rounded-xl text-sm flex-1 focus:outline-indigo-500"
        />
        <button
          type="button"
          onClick={() => {
            onAddCategory(newCatName);
            setNewCatName('');
          }}
          className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700"
        >
          新增分類
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-1 max-h-[260px] overflow-y-auto pr-1">
        {categories.map((cat, index) => (
          <div
            key={cat}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className={`flex items-center justify-between bg-white border px-3 py-2.5 rounded-lg text-sm text-slate-700 font-medium cursor-move transition ${
              dragIndex === index ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-slate-300 select-none text-base">⠿</span>
              {cat}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm(`確定刪除 ${cat} 分類？`)) onDeleteCategory(cat);
              }}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 font-black text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full transition"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}