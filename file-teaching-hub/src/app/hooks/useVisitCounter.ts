'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export function useVisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // 用 sessionStorage 確保同一次瀏覽（同一個分頁）只計算一次，
    // 避免使用者在同一次造訪中重新整理頁面就一直往上加
    const alreadyCounted = sessionStorage.getItem('visit_counted');

    const runCount = async () => {
      if (!alreadyCounted) {
        const { data, error } = await supabase.rpc('increment_visit_count');
        if (!error && typeof data === 'number') {
          setCount(data);
          sessionStorage.setItem('visit_counted', 'true');
          return;
        }
      }
      // 已經計算過，或呼叫失敗，就只讀取目前數字，不再累加
      const { data: statsData } = await supabase
        .from('site_stats')
        .select('count')
        .eq('key', 'total_visits')
        .single();
      if (statsData) setCount(statsData.count);
    };

    runCount();
  }, []);

  return count;
}