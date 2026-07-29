'use client';
import { useState } from 'react';

interface MobileSidebarDrawerProps {
  children: React.ReactNode;
}

export default function MobileSidebarDrawer({ children }: MobileSidebarDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 只要點擊到抽屜內容中的「按鈕」，就視為選擇了分類，自動收合抽屜
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      setIsOpen(false);
    }
  };

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-slate-800/70 backdrop-blur-sm text-white w-11 h-11 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:bg-opacity-100 transition active:scale-95"
        aria-label="開啟分類選單"
      >
        <div className="space-y-1">
          <span className="block w-5 h-0.5 bg-white rounded" />
          <span className="block w-5 h-0.5 bg-white rounded" />
          <span className="block w-5 h-0.5 bg-white rounded" />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="relative bg-slate-50 w-[82%] max-w-xs h-full overflow-y-auto p-5 space-y-6 animate-in slide-in-from-left duration-200 shadow-2xl"
            onClick={handleContentClick}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-sm">選單</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}