import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: tool, error } = await supabase
    .from('tools')
    .select('zip_key, download_name')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to retrieve tool download metadata:', error);
    return new Response('Unable to retrieve download', { status: 500 });
  }
  if (!tool?.zip_key) return new Response('Not found', { status: 404 });

  const { data } = supabase.storage
    .from('tools')
    .getPublicUrl(tool.zip_key, { download: tool.download_name || true });

  return NextResponse.redirect(data.publicUrl, 302);
}
