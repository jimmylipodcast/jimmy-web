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
      <div className="flex flex-col space-y-1">
        {uniqueCourseNames.map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              selected === name
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}