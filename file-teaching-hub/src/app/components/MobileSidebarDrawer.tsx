'use client';
import { useState } from 'react';

interface MobileSidebarDrawerProps {
  children: React.ReactNode;
}

export default function MobileSidebarDrawer({ children }: MobileSidebarDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* 懸浮的三槓按鈕，只在手機/平板寬度顯示 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-slate-800 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-600 transition active:scale-95"
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
          {/* 背景遮罩，點擊可關閉 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          {/* 左側滑出的抽屜本體 */}
          <div className="relative bg-slate-50 w-[82%] max-w-xs h-full overflow-y-auto p-5 space-y-6 animate-in slide-in-from-left duration-200 shadow-2xl">
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