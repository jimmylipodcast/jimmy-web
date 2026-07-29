import { supabase } from './supabase';

// 產生不會撞名的檔名：時間戳 + 隨機字串，保留原始副檔名
function makeFileName(originalName: string) {
  const ext = originalName.split('.').pop();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${rand}.${ext}`;
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