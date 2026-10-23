'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBlog } from '../hooks/useBlog';
import { useAuth } from '../hooks/useAuth';
import AdminControlPanel from '../components/AdminControlPanel';
import CourseList from '../components/CourseList';
import ToolsManager from '../components/ToolsManager';

function AdminLoginCard({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch {
      setError('登入失敗，請確認帳號密碼是否正確');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-100 shadow-xl space-y-4">
        <div>
          <h1 className="font-black text-slate-800 text-base">後台管理登入</h1>
          <p className="text-xs text-slate-400 font-medium">請輸入管理員帳號密碼</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="管理員 Email"
            className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-indigo-500"
            autoFocus
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
            className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-indigo-500"
            required
          />
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition"
          >
            {submitting ? '登入中...' : '登入'}
          </button>
          <Link href="/" className="block text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1">
            ← 回到網站
          </Link>
        </form>
      </div>
    </main>
  );
}

export default function AdminPage() {
  const { isAdmin, authLoading, login, logout } = useAuth();
  const {
    courses,
    categories,
    loading,
    addCourse,
    updateCourse,
    deleteCourse,
    togglePin,
    addCategory,
    deleteCategory,
    reorderCategories
  } = useBlog();

  const [tab, setTab] = useState<'articles' | 'tools'>('articles');

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [courses]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-bold tracking-widest animate-pulse">
        載入中...
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginCard onLogin={login} />;
  }

  const tabClass = (active: boolean) =>
    `text-xs font-bold px-4 py-2 rounded-xl transition ${
      active ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800">後台管理</h1>
            <p className="text-xs text-slate-400 font-medium">高校化學事</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold text-indigo-500 hover:text-indigo-700">
              ← 回到網站
            </Link>
            <button onClick={() => logout()} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              登出
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTab('articles')} className={tabClass(tab === 'articles')}>文章與分類</button>
          <button onClick={() => setTab('tools')} className={tabClass(tab === 'tools')}>工具與下載</button>
        </div>

        {tab === 'articles' ? (
          <>
            <AdminControlPanel
              categories={categories}
              onAddCourse={addCourse}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              onReorderCategories={reorderCategories}
              onLogout={() => logout()}
            />

            <section className="space-y-4">
              <h2 className="text-sm font-black text-slate-700">已發布的文章（{courses.length}）</h2>
              {loading ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold tracking-widest animate-pulse">
                  同步中...
                </div>
              ) : (
                <CourseList
                  courses={sortedCourses}
                  categories={categories}
                  isAdmin={true}
                  onDelete={deleteCourse}
                  onTogglePin={togglePin}
                  onUpdate={updateCourse}
                />
              )}
            </section>
          </>
        ) : (
          <ToolsManager />
        )}
      </div>
    </main>
  );
}