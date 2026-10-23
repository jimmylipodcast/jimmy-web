'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { downloadTools, DownloadTool } from '../lib/tools';

export function useTools() {
  const [tools, setTools] = useState<DownloadTool[] | null>(null);

  useEffect(() => {
    supabase
      .from('tools')
      .select('id, name, description, version, updated_label, zip_key')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setTools(downloadTools);
          return;
        }
        setTools(
          data.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description || '',
            path: `/tools/${row.id}/`,
            downloadPath: row.zip_key ? `/downloads/${row.id}` : undefined,
            version: row.version || undefined,
            updatedAt: row.updated_label || undefined,
          }))
        );
      });
  }, []);

  return tools;
}