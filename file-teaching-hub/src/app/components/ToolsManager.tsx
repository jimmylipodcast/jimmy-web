'use client';
import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { supabase } from '../../utils/supabase';
import { ToolFile, MAX_FILE_BYTES, extOf, mimeFromPath } from '../lib/toolTypes';

const BUCKET = 'tools';

interface ToolRow {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  updated_label: string | null;
  entry_path: string | null;
  files: ToolFile[] | null;
  zip_key: string | null;
  download_name: string | null;
}

interface PreparedFile {
  path: string;
  data: Uint8Array;
  hash: string;
  type: string;
  size: number;
}

interface PreparedZip {
  files: PreparedFile[];
  htmlCandidates: string[];
  defaultEntry: string;
  zipBytes: Uint8Array;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isDuplicate(err: any) {
  return err?.statusCode === '409' || /already exists|duplicate/i.test(err?.message || '');
}

function todayLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

async function prepareZip(file: File): Promise<PreparedZip> {
  const zipBytes = new Uint8Array(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(zipBytes);

  const entries = Object.values(zip.files).filter((entry) => {
    if (entry.dir) return false;
    const base = entry.name.split('/').pop() || '';
    return !entry.name.startsWith('__MACOSX/') && !base.startsWith('.');
  });
  if (entries.length === 0) throw new Error('壓縮檔是空的');

  // 如果所有檔案都包在同一個資料夾裡，自動拿掉最外層資料夾
  const firstSegments = Array.from(new Set(entries.map((e) => e.name.split('/')[0])));
  const allNested = entries.every((e) => e.name.includes('/'));
  const prefix = allNested && firstSegments.length === 1 ? firstSegments[0] + '/' : '';

  const files: PreparedFile[] = [];
  for (const entry of entries) {
    const path = entry.name.slice(prefix.length);
    const data = await entry.async('uint8array');
    if (data.byteLength > MAX_FILE_BYTES) {
      throw new Error(`檔案「${path}」超過 4MB，請先壓縮後再上傳`);
    }
    files.push({
      path,
      data,
      hash: await sha256Hex(data),
      type: mimeFromPath(path),
      size: data.byteLength,
    });
  }

  const htmlCandidates = files
    .filter((f) => ['html', 'htm'].includes(extOf(f.path)))
    .map((f) => f.path);
  if (htmlCandidates.length === 0) throw new Error('壓縮檔裡找不到 HTML 檔');

  const defaultEntry =
    htmlCandidates.find((p) => p.toLowerCase() === 'index.html') ||
    htmlCandidates.find((p) => !p.includes('/')) ||
    htmlCandidates[0];

  return { files, htmlCandidates, defaultEntry, zipBytes };
}

export default function ToolsManager() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [toolId, setToolId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [downloadName, setDownloadName] = useState('');

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [prepared, setPrepared] = useState<PreparedZip | null>(null);
  const [entry, setEntry] = useState('');
  const [fileKey, setFileKey] = useState(Date.now());

  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadTools = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('tools')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (!loadError && data) setTools(data as ToolRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const resetForm = () => {
    setMode('idle');
    setToolId('');
    setName('');
    setDescription('');
    setVersion('');
    setDateLabel('');
    setDownloadName('');
    setZipFile(null);
    setPrepared(null);
    setEntry('');
    setStatus('');
    setError('');
    setFileKey(Date.now());
  };

  const startCreate = () => {
    resetForm();
    setMode('create');
    setDateLabel(todayLabel());
  };

  const startEdit = (tool: ToolRow) => {
    resetForm();
    setMode('edit');
    setToolId(tool.id);
    setName(tool.name);
    setDescription(tool.description || '');
    setVersion(tool.version || '');
    setDateLabel(todayLabel());
    setDownloadName(tool.download_name || '');
  };

  const currentTool = tools.find((t) => t.id === toolId.trim()) || null;
  const oldFiles: ToolFile[] = currentTool?.files || [];
  const changedFiles = prepared
    ? prepared.files.filter((f) => !oldFiles.some((o) => o.path === f.path && o.hash === f.hash))
    : [];

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPrepared(null);
    setZipFile(null);
    setError('');
    if (!file) return;

    setStatus('解壓縮並檢查檔案中...');
    try {
      const result = await prepareZip(file);
      setZipFile(file);
      setPrepared(result);
      setEntry(result.defaultEntry);
    } catch (err: any) {
      setError(err.message || '壓縮檔讀取失敗');
      setFileKey(Date.now());
    } finally {
      setStatus('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = toolId.trim();

    if (mode === 'create') {
      if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(id)) {
        setError('工具代號只能使用小寫英文、數字與連字號（例如 seat-planner）');
        return;
      }
      if (tools.some((t) => t.id === id)) {
        setError('這個代號已經存在，請改用該工具的「更新」');
        return;
      }
      if (!prepared || !zipFile) {
        setError('請先選擇壓縮檔');
        return;
      }
    }
    if (!name.trim()) {
      setError('請輸入工具名稱');
      return;
    }

    setBusy(true);
    try {
      const existing = tools.find((t) => t.id === id) || null;
      const previousFiles: ToolFile[] = existing?.files || [];
      let manifest: ToolFile[] = previousFiles;
      let entryPath = existing?.entry_path || null;
      let zipKey = existing?.zip_key || null;

      if (prepared && zipFile) {
        const toUpload = prepared.files.filter(
          (f) => !previousFiles.some((o) => o.path === f.path && o.hash === f.hash)
        );
        manifest = [];
        let done = 0;

        for (const f of prepared.files) {
          const reuse = previousFiles.find((o) => o.path === f.path && o.hash === f.hash);
          if (reuse) {
            manifest.push(reuse);
            continue;
          }
          const ext = extOf(f.path);
          const key = `${id}/${f.hash.slice(0, 24)}${ext ? '.' + ext : ''}`;
          setStatus(`上傳檔案中 ${done + 1}/${toUpload.length}：${f.path}`);
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(key, f.data, { contentType: f.type, upsert: false });
          if (upErr && !isDuplicate(upErr)) throw upErr;
          manifest.push({ path: f.path, key, hash: f.hash, type: f.type, size: f.size });
          done++;
        }

        entryPath = entry;

        setStatus('上傳離線下載檔中...');
        const zipHash = await sha256Hex(prepared.zipBytes);
        zipKey = `${id}/zips/${zipHash.slice(0, 24)}.zip`;
        const { error: zipErr } = await supabase.storage
          .from(BUCKET)
          .upload(zipKey, prepared.zipBytes, { contentType: 'application/zip', upsert: false });
        if (zipErr && !isDuplicate(zipErr)) throw zipErr;
      }

      setStatus('儲存設定中...');
      const row: Record<string, unknown> = {
        id,
        name: name.trim(),
        description: description.trim() || null,
        version: version.trim() || null,
        updated_label: dateLabel.trim() || null,
        entry_path: entryPath,
        files: manifest,
        zip_key: zipKey,
        download_name: downloadName.trim() || `${name.trim()}_離線版.zip`,
        updated_at: new Date().toISOString(),
      };
      if (!existing) row.sort_order = tools.length;

      const { error: dbErr } = await supabase.from('tools').upsert(row);
      if (dbErr) throw dbErr;

      // 清掉新版本已經不再使用的舊檔案
      const keep = new Set<string>(manifest.map((f) => f.key));
      if (zipKey) keep.add(zipKey);
      const orphans = [
        ...previousFiles.map((f) => f.key),
        ...(existing?.zip_key ? [existing.zip_key] : []),
      ].filter((k) => !keep.has(k));
      if (orphans.length > 0) {
        const { error: rmErr } = await supabase.storage
          .from(BUCKET)
          .remove(Array.from(new Set(orphans)));
        if (rmErr) console.error('清除舊檔案失敗:', rmErr);
      }

      resetForm();
      await loadTools();
      alert('工具已儲存');
    } catch (err: any) {
      console.error('儲存工具失敗:', err);
      setError(err?.message || '儲存失敗，請稍後再試');
    } finally {
      setBusy(false);
      setStatus('');
    }
  };

  const handleDelete = async (tool: ToolRow) => {
    if (!confirm(`確定刪除「${tool.name}」？線上版與下載檔都會一併移除。`)) return;
    const keys = [
      ...(tool.files || []).map((f) => f.key),
      ...(tool.zip_key ? [tool.zip_key] : []),
    ];
    const { error: delErr } = await supabase.from('tools').delete().eq('id', tool.id);
    if (delErr) {
      alert('刪除失敗：' + delErr.message);
      return;
    }
    if (keys.length > 0) {
      await supabase.storage.from(BUCKET).remove(Array.from(new Set(keys)));
    }
    await loadTools();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-700">工具與下載專區（{tools.length}）</h2>
        {mode === 'idle' && (
          <button
            onClick={startCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            ＋ 新增工具
          </button>
        )}
      </div>

      {/* 工具列表 */}
      {loading ? (
        <div className="text-center py-8 text-slate-400 text-xs font-bold tracking-widest animate-pulse">同步中...</div>
      ) : tools.length === 0 && mode === 'idle' ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs font-bold">
          目前資料庫裡還沒有工具，前台暫時使用原本內建的清單。
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {tool.name}
                  {tool.version && (
                    <span className="ml-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-black">
                      {tool.version}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  代號：{tool.id}｜更新日期：{tool.updated_label || '—'}｜{(tool.files || []).length} 個檔案
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a
                  href={`/api/tool-preview/${tool.id}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  預覽線上版
                </a>
                <button
                  onClick={() => startEdit(tool)}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                >
                  更新
                </button>
                <button
                  onClick={() => handleDelete(tool)}
                  className="text-xs font-bold px-3 py-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增 / 更新表單 */}
      {mode !== 'idle' && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-700">
            {mode === 'create' ? '新增工具' : `更新：${name}`}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">工具代號（網址用，建立後不能改）</label>
              <input
                type="text"
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                disabled={mode === 'edit'}
                placeholder="例如 seat-planner"
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">工具名稱</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如 高校座位表達人"
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500">說明</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">版本</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="例如 v1.7.0"
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">更新日期</label>
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="例如 10/18"
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-500">下載時的檔名</label>
              <input
                type="text"
                value={downloadName}
                onChange={(e) => setDownloadName(e.target.value)}
                placeholder="預設：工具名稱_離線版.zip"
                className="border border-slate-200 p-2 rounded-xl text-xs focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-indigo-600">
              📦 離線版壓縮檔（{mode === 'create' ? '必填' : '選填，不選就只更新上面的文字資訊'}）
            </label>
            <input
              key={fileKey}
              type="file"
              accept=".zip"
              onChange={handleZipChange}
              className="border border-dashed border-indigo-200 p-2 rounded-xl text-xs bg-indigo-50/20 text-slate-600 focus:outline-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              上傳一次，線上版與下載版會同時更新；只有內容有變動的檔案才會重新上傳。
            </p>
          </div>

          {prepared && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-[11px] text-slate-500">
              <p>
                共 {prepared.files.length} 個檔案，其中 <b className="text-slate-700">{changedFiles.length}</b> 個有變動會上傳，其餘沿用舊檔。
              </p>
              {prepared.htmlCandidates.length > 1 ? (
                <div className="flex items-center gap-2">
                  <span>線上版入口：</span>
                  <select
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600"
                  >
                    {prepared.htmlCandidates.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p>線上版入口：{entry}</p>
              )}
            </div>
          )}

          {status && <p className="text-xs font-bold text-indigo-600">{status}</p>}
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
            >
              {busy ? '處理中...' : '儲存'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}