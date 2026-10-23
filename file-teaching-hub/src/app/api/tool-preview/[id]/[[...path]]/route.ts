import { serveTool } from '../../../../lib/serveTool';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const { id, path } = await params;
  return serveTool(request, id, path ?? [], `/api/tool-preview/${id}/`);
}
