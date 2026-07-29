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

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);

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

  const makeFileName = (originalName: string) => {
    const ext = originalName.split('.').pop();
    const rand = Math.random().toString(36).slice(2, 8);
    return `${Date.now()}-${rand}.${ext}`;
  };

  const addCourse = useCallback(async (
    newCourse: Course,
    files?: { imageFile?: File; pdfFiles?: File[] }
  ) => {
    try {
      let finalImageUrl: string | null = null;
      const finalPdfUrls: string[] = [];

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

  // ☁️ 雲端同步：修改文章（可更換圖片、增刪 PDF）
  const updateCourse = useCallback(async (
    id: string,
    fields: {
      title: string;
      courseName: string;
      content: string;
      videoUrl?: string;
      isPinned: boolean;
      removeImage?: boolean;
      keptPdfUrls: string[];
    },
    files?: { imageFile?: File; pdfFiles?: File[] }
  ) => {
    try {
      const target = courses.find(c => c.id === id);
      let finalImageUrl: string | null = target?.imageUrl || null;

      // 1. 選了新圖片就上傳並取代；勾選移除就清空
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
      } else if (fields.removeImage) {
        finalImageUrl = null;
      }

      // 2. 保留使用者留下的舊 PDF，加上新上傳的
      const finalPdfUrls: string[] = [...fields.keptPdfUrls];
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

      const { error } = await supabase.from('courses').update({
        title: fields.title,
        course_name: fields.courseName,
        content: fields.content,
        image_url: finalImageUrl,
        video_url: fields.videoUrl || null,
        pdf_urls: finalPdfUrls.length > 0 ? finalPdfUrls : null,
        is_pinned: fields.isPinned
      }).eq('id', id);

      if (error) throw error;
      await refreshData();
      alert('文章更新成功！');
    } catch (error: any) {
      console.error('更新失敗詳情:', error);
      alert(`更新失敗：${error.message || '請檢查網路或設定'}`);
    }
  }, [courses, refreshData]);

  const deleteCourse = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      alert('刪除失敗');
    }
  }, [refreshData]);

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

  const deleteCategory = useCallback(async (name: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('name', name);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      alert('刪除分類失敗，可能該分類下還有文章綁定');
    }
  }, [refreshData]);

  const reorderCategories = useCallback(async (orderedNames: string[]) => {
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
    updateCourse,
    deleteCourse,
    togglePin,
    addCategory,
    deleteCategory,
    reorderCategories
  };
}