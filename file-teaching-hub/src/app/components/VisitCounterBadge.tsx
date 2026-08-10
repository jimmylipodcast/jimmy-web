'use client';
import { useVisitCounter } from '../hooks/useVisitCounter';

export default function VisitCounterBadge() {
  const count = useVisitCounter();

  if (count === null) return null;

  return (
    <div className="fixed bottom-5 left-5 z-30 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-400 shadow-sm">
      👁 總瀏覽 {count.toLocaleString('zh-TW')} 次
    </div>
  );
}