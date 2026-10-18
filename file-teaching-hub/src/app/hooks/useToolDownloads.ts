'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';

export function useToolDownloads() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from('tool_stats')
      .select('tool_id, download_count')
      .then(({ data, error }) => {
        if (error || !data) return;
        const map: Record<string, number> = {};
        data.forEach((row: any) => {
          map[row.tool_id] = Number(row.download_count);
        });
        setCounts(map);
      });
  }, []);

  const recordDownload = useCallback(async (toolId: string) => {
    // 先在畫面上 +1，讓使用者立刻看到數字變化
    setCounts((prev) => ({ ...prev, [toolId]: (prev[toolId] ?? 0) + 1 }));

    const { data, error } = await supabase.rpc('increment_tool_download', {
      p_tool_id: toolId
    });

    if (error) {
      // 寫入失敗就把畫面上的 +1 還原
      setCounts((prev) => ({ ...prev, [toolId]: Math.max((prev[toolId] ?? 1) - 1, 0) }));
      console.error('下載次數更新失敗:', error);
    } else if (data !== null && data !== undefined) {
      setCounts((prev) => ({ ...prev, [toolId]: Number(data) }));
    }
  }, []);

  return { counts, recordDownload };
}