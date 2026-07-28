'use client';

interface CategorySelectorProps {
  uniqueCourseNames: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategorySelector({ uniqueCourseNames, selected, onSelect }: CategorySelectorProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
        文章分類
      </h4>
      <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto pr-1">
        {uniqueCourseNames.map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              selected === name
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}