'use client';
import { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: '小', value: '2' },
  { label: '中', value: '3' },
  { label: '大', value: '5' },
  { label: '特大', value: '7' },
];

const COLORS = ['#0f172a', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // 只在初次掛載，或外部 value 被重置（例如表單清空）時才覆蓋內容
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (isFirstRender.current || value === '') {
        editorRef.current.innerHTML = value || '';
      }
    }
    isFirstRender.current = false;
  }, [value]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('請輸入超連結網址（例如 https://example.com）');
    if (url) {
      exec('createLink', url);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
      {/* 工具列 */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border-b border-slate-200 p-2">
        <button type="button" onClick={() => exec('bold')} className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-black text-slate-600 hover:bg-slate-200">
          B
        </button>
        <button type="button" onClick={() => exec('italic')} className="w-7 h-7 flex items-center justify-center rounded-md text-xs italic font-bold text-slate-600 hover:bg-slate-200">
          I
        </button>
        <button type="button" onClick={() => exec('underline')} className="w-7 h-7 flex items-center justify-center rounded-md text-xs underline font-bold text-slate-600 hover:bg-slate-200">
          U
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1" />

        <select
          onChange={(e) => {
            if (e.target.value) exec('fontSize', e.target.value);
            e.target.value = '';
          }}
          defaultValue=""
          className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-600 focus:outline-indigo-500"
        >
          <option value="" disabled>字級</option>
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <span className="w-px h-5 bg-slate-300 mx-1" />

        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => exec('foreColor', c)}
            style={{ backgroundColor: c }}
            className="w-5 h-5 rounded-full border border-slate-200"
          />
        ))}

        <span className="w-px h-5 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={handleInsertLink}
          className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md"
        >
          插入超連結
        </button>
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className="text-xs font-bold text-slate-400 hover:bg-slate-200 px-2 py-1 rounded-md"
        >
          清除格式
        </button>
      </div>

      {/* 編輯區域 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder || '請輸入內容...'}
        className="course-content min-h-[120px] max-h-[400px] overflow-y-auto p-3 text-xs text-slate-700 leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
        suppressContentEditableWarning
      />
    </div>
  );
}