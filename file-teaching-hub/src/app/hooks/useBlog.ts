'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../utils/supabase';

export interface Course {
  id: string;
  title: string;
  courseName: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  pdfUrls?: string[];
  createdAt: string;
  isPinned: boolean;
}

export function useBlog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ☁️ 從雲端資料庫撈取所有講義與分類
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. 撈取文章
      const { data: coursesData, error: cError } = await supabase
        .from('courses')
        .select('*');

      if (cError) throw cError;

      const cleanedCourses: Course[] = (coursesData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        courseName: item.course_name,
        content: item.content || '',
        imageUrl: item.image_url || undefined,
        videoUrl: item.video_url || undefined,
        pdfUrls: item.pdf_urls || undefined,
        createdAt: item.created_at,
        isPinned: item.is_pinned,
      }));

      // 2. 撈取自訂分類目錄，並依照 position 排序
      const { data: catsData, error: catError } = await supabase
        .from('categories')
        .select('name, position')
        .order('position', { ascending: true, nullsFirst: false });

      if (catError) throw catError;

      setCourses(cleanedCourses);
      setCategories((catsData || []).map((c: any) => c.name));
    } catch (error) {
      console.error('Supabase 讀取失敗:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ☁️ 雲端同步：新增文章（圖片上傳 + YouTube 網址 + 多個 PDF 上傳，三者互不干擾）
  const addCourse = useCallback(async (
    newCourse: Course,
    files?: { imageFile?: File; pdfFiles?: File[] }
  ) => {
    try {
      let finalImageUrl: string | null = null;
      const finalPdfUrls: string[] = [];

      // 產生不會撞名的檔名：時間戳 + 隨機字串
      const makeFileName = (originalName: string) => {
        const ext = originalName.split('.').pop();
        const rand = Math.random().toString(36).slice(2, 8);
        return `${Date.now()}-${rand}.${ext}`;
      };

      // 1. 圖片檔案上傳到 'images' bucket
      if (files?.imageFile) {
        const file = files.imageFile;
        const filePath = makeFileName(file.name);

        const { error: imgUploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (imgUploadError) throw imgUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      // 2. 多個 PDF 檔案，逐一上傳到 'lectures' bucket
      if (files?.pdfFiles && files.pdfFiles.length > 0) {
        for (const file of files.pdfFiles) {
          const filePath = makeFileName(file.name);

          const { error: pdfUploadError } = await supabase.storage
            .from('lectures')
            .upload(filePath, file);

          if (pdfUploadError) throw pdfUploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('lectures')
            .getPublicUrl(filePath);

          finalPdfUrls.push(publicUrl);
        }
      }

      // 3. 寫入資料庫，各欄位互不覆蓋
      const { error } = await supabase.from('courses').insert([{
        id: newCourse.id,
        title: newCourse.title,
        course_name: newCourse.courseName,
        content: newCourse.content,
        image_url: finalImageUrl,
        video_url: newCourse.videoUrl || null,
        pdf_urls: finalPdfUrls.length > 0 ? finalPdfUrls : null,
        created_at: newCourse.createdAt,
        is_pinned: newCourse.isPinned
      }]);

      if (error) throw error;
      await refreshData();
      alert('講義發布成功！');
    } catch (error: any) {
      console.error('發布失敗詳情:', error);
      alert(`發布失敗：${error.message || '請檢查網路或設定'}`);
    }
  }, [refreshData]);

  // ☁️ 雲端同步：刪除文章
  const deleteCourse = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      alert('刪除失敗');
    }
  }, [refreshData]);

  // ☁️ 雲端同步：切換置頂
  const togglePin = useCallback(async (id: string) => {
    const target = courses.find(c => c.id === id);
    if (!target) return;
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_pinned: !target.isPinned })
        .eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      alert('置頂修改失敗');
    }
  }, [courses, refreshData]);

  // ☁️ 雲端同步：新增分類目錄（自動接在最後一個順序）
  const addCategory = useCallback(async (name: string) => {
    if (!name.trim() || categories.includes(name.trim())) return;
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: name.trim(), position: categories.length }]);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      alert('新增分類失敗');
    }
  }, [categories, refreshData]);

  // ☁️ 雲端同步：刪除分類目錄
  const deleteCategory = useCallback(async (name: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('name', name);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      alert('刪除分類失敗，可能該分類下還有文章綁定');
    }
  }, [refreshData]);

  // ☁️ 雲端同步：拖曳調整分類順序
  const reorderCategories = useCallback(async (orderedNames: string[]) => {
    // 先在畫面上立即更新，操作起來才順暢
    setCategories(orderedNames);
    try {
      await Promise.all(
        orderedNames.map((name, index) =>
          supabase.from('categories').update({ position: index }).eq('name', name)
        )
      );
    } catch (error) {
      console.error('分類排序更新失敗:', error);
      alert('排序儲存失敗，將還原原本順序');
      await refreshData();
    }
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const uniqueCourseNames = useMemo(() => {
    return ['全部文章', ...categories];
  }, [categories]);

  return {
    courses,
    uniqueCourseNames,
    categories,
    loading,
    refreshData,
    addCourse,
    deleteCourse,
    togglePin,
    addCategory,
    deleteCategory,
    reorderCategories
  };
}