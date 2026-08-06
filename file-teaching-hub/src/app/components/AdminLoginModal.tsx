'use client';

import { useState } from 'react';

export default function AdminLoginModal({ onClose, onLoginSuccess }: { onClose: () => void; onLoginSuccess: () => void }) {
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 預設簡易密碼驗證，你可以自由修改
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      onLoginSuccess();
    } else {
      alert('密碼輸入錯誤，請再試一次！');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div>
          <h3 className="font-black text-slate-800 text-base">解鎖後台管理系統</h3>
          <p className="text-xs text-slate-400 font-medium">請輸入管理員密碼以開啟發布與刪除權限</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入管理員密碼"
            className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-indigo-500"
            autoFocus
            required
          />
          <div className="flex space-x-2 pt-2">
            <button type="button" onClick={onClose} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition">
              取消返回
            </button>
            <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs">
              驗證登入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}