import { supabase } from './supabase';

function makeFileName(originalName: string) {
  const rand = Math.random().toString(36).slice(2, 8);
  // 保留原始檔名，只在前面加上不會撞名的隨機前綴，避免多個同名檔案互相覆蓋
  const safeName = originalName.replace(/[^\u4e00-\u9fa5a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${rand}-${safeName}`;
}

// 共用上傳函式：把檔案傳到指定的 Supabase Storage bucket，回傳公開下載網址
export async function uploadFileToStorage(file: File, bucket: string): Promise<string> {
  const filePath = makeFileName(file.name);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

// 共用函式：一次上傳多個檔案，回傳網址陣列（依序對應）
export async function uploadMultipleFiles(files: File[], bucket: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFileToStorage(file, bucket);
    urls.push(url);
  }
  return urls;
}