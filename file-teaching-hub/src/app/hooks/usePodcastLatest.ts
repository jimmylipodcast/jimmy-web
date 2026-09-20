'use client';
import { useState, useEffect } from 'react';

export interface PodcastEpisode {
  title: string;
  link: string;
  pubDate: string;
  image: string;
}

export function usePodcastLatest() {
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/podcast')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) setEpisode(data);
      })
      .catch((err) => console.error('取得 Podcast 最新集數失敗:', err))
      .finally(() => setLoading(false));
  }, []);

  return { episode, loading };
}