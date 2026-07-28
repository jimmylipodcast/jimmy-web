'use client';

import { useState, useMemo } from 'react';
import { useBlog } from './hooks/useBlog'; // 修正：具名導入

import CourseHeader from './components/CourseHeader';
import LatestAnnouncement from './components/LatestAnnouncement';
import CourseList from './components/CourseList';

import CategorySelector from './components/CategorySelector';
import PodcastWidget from './components/PodcastWidget';
import AdminControlPanel from './components/AdminControlPanel';
import AdminLoginModal from './components/AdminLoginModal';

export default function Home() {
  const {
    courses,
    uniqueCourseNames,
    categories,
    loading,
    addCourse,
    deleteCourse,
    togglePin,
    addCategory,
    deleteCategory,
    reorderCategories
  } = useBlog();

  const [selected, setSelected] = useState('全部文章');
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // 1. 完善的資料排序與公告邏輯
  const { announcementArticle, sortedList } = useMemo(() => {
    const matched = courses.filter((c) => {
      const matchesCategory = selected === '全部文章' || c.courseName === selected;
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.content.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const list = [...matched].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const latest = courses.length > 0
      ? [...courses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;

    return { announcementArticle: latest, sortedList: list };
  }, [courses, selected, search]);

  // 2. 智慧導航函數
  const handleAnnouncementClick = (articleId: string) => {
    const targetId = `course-card-${articleId}`;
    const element = document.getElementById(targetId);
    if (!element) {
      setSelected('全部文章');
      setSearch('');
      setTimeout(() => {
        const reRenderedElement = document.getElementById(targetId);
        reRenderedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-6 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-10">
        <CourseHeader
          searchQuery={search}
          setSearchQuery={setSearch}
          isAdmin={isAdmin}
          onLockClick={() => (isAdmin ? setIsAdmin(false) : setIsLoginOpen(true))}
        />

        {isAdmin && (
          <AdminControlPanel
            categories={categories}
            onAddCourse={addCourse}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onLogout={() => setIsAdmin(false)}
            onReorderCategories={reorderCategories}
          />
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold tracking-widest animate-pulse">
            正在即時同步雲端教學講義資料中...
          </div>
        ) : (
          <>
            {announcementArticle && (
              <div className="bg-[#121624] text-white rounded-3xl p-6 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">最新重要公告</span>
                  </div>
                  <h2 className="text-base font-black tracking-tight">{announcementArticle.title}</h2>
                </div>
                <button
                  onClick={() => handleAnnouncementClick(announcementArticle.id)}
                  className="bg-white text-slate-900 px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition active:scale-[0.97] cursor-pointer shadow-sm shrink-0"
                >
                  閱讀此文 →
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <CourseList
                  courses={sortedList}
                  isAdmin={isAdmin}
                  onDelete={deleteCourse}
                  onTogglePin={togglePin}
                />
              </div>

              <div className="space-y-6 sticky top-6">
                <CategorySelector
                  uniqueCourseNames={uniqueCourseNames}
                  selected={selected}
                  onSelect={setSelected}
                />
                <PodcastWidget />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. 🎯 修正登入彈窗邏輯：條件渲染，關閉時徹底從頁面消失 */}
      {isLoginOpen && (
        <AdminLoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={() => {
            setIsAdmin(true);
            setIsLoginOpen(false);
          }}
        />
      )}
    </main>
  );
}