'use client';

interface CourseHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdmin: boolean;
  onLockClick: () => void;
}

export default function CourseHeader({ searchQuery, setSearchQuery, isAdmin, onLockClick }: CourseHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">高校化學事的科普與化學園地</h1>
        <p className="text-xs text-slate-400 font-medium">系統化排版講義與最新公告專區</p>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋講義或公告關鍵字..."
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs w-full md:w-64 focus:outline-indigo-500 shadow-xs"
        />
        <button
          onClick={onLockClick}
          className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs ${
            isAdmin 
              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>{isAdmin ? '🔒 鎖定後台' : '🔓 管理員登入'}</span>
        </button>
      </div>
    </div>
  );
}