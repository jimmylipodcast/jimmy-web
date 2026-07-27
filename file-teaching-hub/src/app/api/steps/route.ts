import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 📂 定義資料儲存的 json 檔案路徑
const filePath = path.join(process.cwd(), 'src/app/api/steps/steps.json');

// 🛠️ 輔助函式：安全讀取檔案
function readDataFromFile() {
  try {
    if (!fs.existsSync(filePath)) {
      // 如果檔案不存在，初始化一個空陣列並建立檔案
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const fileData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileData || '[]');
  } catch (error) {
    console.error("後端讀取 JSON 檔案失敗:", error);
    return [];
  }
}

// 🛠️ 輔助函式：安全寫入檔案
function writeDataToFile(data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("後端寫入 JSON 檔案失敗:", error);
  }
}

// ==========================================
// 1. GET: 獲取所有部落格文章/課程資料
// ==========================================
export async function GET() {
  const data = readDataFromFile();
  return NextResponse.json(data);
}

// ==========================================
// 2. POST: 建立/上傳新文章
// ==========================================
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // 簡單驗證必要欄位
    if (!payload.courseName || !payload.title || !payload.description) {
      return NextResponse.json({ message: '缺少必要欄位 (分類、標題或內文)' }, { status: 400 });
    }

    const currentData = readDataFromFile();

    // 建立新文章物件
    const newCourse = {
      id: payload.id || Date.now().toString(), // 如果前端沒給 ID，用時間戳記生成
      courseName: payload.courseName,
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl || '',
      videoUrl: payload.videoUrl || '',
      links: payload.links || []
    };

    currentData.unshift(newCourse); // 將新文章推到最前面（最新發布）
    writeDataToFile(currentData);

    return NextResponse.json({ message: '文章發布成功', data: newCourse }, { status: 201 });
  } catch (error) {
    console.error("後端 POST 發生錯誤:", error);
    return NextResponse.json({ message: '伺服器解析請求失敗' }, { status: 500 });
  }
}

// ==========================================
// 3. DELETE: 永久刪除文章 (終極防錯除錯版)
// ==========================================
export async function DELETE(request: Request) {
  try {
    const payload = await request.json();
    
    // 🔍 終極除錯：在終端機印出前端傳來的完整 JSON 內容
    console.log("=== 後端 DELETE 接收到的資料 ===", payload);

    // ✨ 修正點：同時支援 secretKey 或 password 欄位，並自動去除前後空白
    const clientKey = (payload.secretKey || payload.password || "").toString().trim();
    
    // 定義後端正確的管理密鑰
    const TEACHER_SECRET_KEY = 'teacher777';

    // 嚴格驗證密鑰
    if (clientKey !== TEACHER_SECRET_KEY) {
      return NextResponse.json({ 
        message: `管理密鑰驗證失敗！` 
      }, { status: 403 });
    }

    // 驗證文章 ID 是否存在
    if (!payload.id) {
      return NextResponse.json({ message: '刪除失敗：未提供文章 ID' }, { status: 400 });
    }

    const currentData = readDataFromFile();
    
    // ✨ 防護機制：將 ID 一律轉為字串進行過濾比對，防止型態不一致（字串 vs 數字）
    const updatedData = currentData.filter((item: any) => item.id.toString() !== payload.id.toString());

    // 檢查有沒有真的刪掉東西（除錯用）
    if (currentData.length === updatedData.length) {
      console.log(`⚠️ 警告：在 JSON 中找不到 ID 為 [${payload.id}] 的文章，未進行實質刪除。`);
    }

    // 覆蓋寫入檔案
    writeDataToFile(updatedData);

    return NextResponse.json({ message: '資料永久刪除成功' }, { status: 200 });
  } catch (error) {
    console.error("後端 DELETE 函式崩潰:", error);
    return NextResponse.json({ message: '伺服器發生未知的解析錯誤' }, { status: 500 });
  }
}