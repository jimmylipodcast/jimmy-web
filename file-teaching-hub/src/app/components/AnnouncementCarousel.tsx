'use client';
import { useRef, useState, useEffect } from 'react';
import { usePodcastLatest } from '../hooks/usePodcastLatest';

interface AnnouncementCarouselProps {
  articleTitle: string;
  onArticleClick: () => void;
}

export default function AnnouncementCarousel({ articleTitle, onArticleClick }: AnnouncementCarouselProps) {
  const { episode } = usePodcastLatest();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideCount = episode ? 2 : 1;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(index);
  };

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.clientWidth,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* 第一張：網站最新文章 */}
        <div className="w-full flex-shrink-0 snap-start">
          <div className="bg-[#121624] text-white p-6 flex items-center justify-between shadow-lg">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">最新重要公告</span>
              </div>
              <h2 className="text-base font-black tracking-tight truncate">{articleTitle}</h2>
            </div>
            <button
              onClick={onArticleClick}
              className="bg-white text-slate-900 px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition active:scale-[0.97] cursor-pointer shadow-sm shrink-0 ml-4"
            >
              閱讀此文 →
            </button>
          </div>
        </div>

        {/* 第二張：Podcast 最新一集，只有成功取得資料時才顯示 */}
        {episode && (
          <div className="w-full flex-shrink-0 snap-start">
            
              href={episode.link}
              target="_blank"
              rel="noreferrer"
              className="block bg-[#1a1030] text-white p-6 flex items-center justify-between shadow-lg gap-4 hover:opacity-95 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
                {episode.image && (
                  <img
                    src={episode.image}
                    alt={episode.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">Podcast 最新一集</span>
                  </div>
                  <h2 className="text-sm font-black tracking-tight truncate">{episode.title}</h2>
                </div>
              </div>
              <span className="bg-white text-slate-900 px-5 py-2 rounded-xl text-xs font-bold shrink-0">
                前往收聽 →
              </span>
            </a>
          </div>
        )}
      </div>

      {/* 指示點：只有兩張以上時才顯示 */}
      {slideCount > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: slideCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === idx ? 'w-5 bg-slate-700' : 'w-1.5 bg-slate-300'
              }`}
              aria-label={`前往第 ${idx + 1} 張`}
            />
          ))}
        </div>
      )}
    </div>
  );
}