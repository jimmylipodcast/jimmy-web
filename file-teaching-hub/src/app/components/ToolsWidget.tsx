'use client';
import { downloadTools } from '../lib/tools';

export default function ToolsWidget() {
  if (downloadTools.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-sm">
      <h2 className="font-black text-slate-800 text-base mb-4">工具與下載專區</h2>
      <div className="space-y-3">
        {downloadTools.map((tool) => (
          <div
            key={tool.id}
            className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/40 transition group"
          >
            <a href={tool.path} target="_blank" rel="noreferrer" className="block">
              <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{tool.name}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
            </a>
            {tool.downloadPath && (
              <a
                href={tool.downloadPath}
                download={tool.downloadFileName}
                className="inline-block mt-2 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 underline"
              >
                下載離線版
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}