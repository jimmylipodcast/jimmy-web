'use client';
import { useState } from 'react';

export default function MaintenancePage({ onUnlock }: { onUnlock: () => void }) {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');

  const handleUnlock = () => {
    if (code === process.env.NEXT_PUBLIC_MAINTENANCE_BYPASS_CODE) {
      onUnlock();
    } else {
      alert('驗證碼錯誤');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">🛠</div>
        <h1 className="text-xl font-black text-slate-800">網站維護中</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          網站目前正在進行系統維護與更新，暫時無法瀏覽。<br />
          造成不便敬請見諒，我們會盡快恢復服務。
        </p>

        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="text-[10px] text-slate-300 hover:text-slate-400 mt-8"
          >
            •
          </button>
        ) : (
          <div className="flex gap-2 justify-center pt-4">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="維護人員驗證碼"
              className="border border-slate-200 p-2 rounded-lg text-xs w-40 focus:outline-indigo-500"
            />
            <button
              onClick={handleUnlock}
              className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              進入
            </button>
          </div>
        )}
      </div>
    </div>
  );
}