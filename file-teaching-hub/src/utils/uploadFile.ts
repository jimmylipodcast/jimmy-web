import { supabase } from './supabase';

function makeFileName(originalName: string) {
  const rand = Math.random().toString(36).slice(2, 8);
  const ext = originalName.split('.').pop() || 'pdf';
  // Storage 的 key 只能用英數字、底線、連字號，不能有中文或其他特殊符號
  return `${Date.now()}-${rand}.${ext}`;
}

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

export async function uploadMultipleFiles(files: File[], bucket: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFileToStorage(file, bucket);
    urls.push(url);
  }
  return urls;
}