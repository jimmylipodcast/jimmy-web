import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/app/api/steps/steps.json');

// 輔助函式：安全讀取檔案
function readDataFromFile() {
  try {
    if (!fs.existsSync(filePath)) {
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const initialData = { steps: [], categories: ['化學高一', '化學高二', '化學高三'] };
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(fileData || '{}');
    // 相容舊格式：如果原本只存陣列，則轉為新格式
    if (Array.isArray(parsed)) {
      return { steps: parsed, categories: ['化學高一', '化學高二', '化學高三'] };
    }
    return {
      steps: parsed.steps || [],
      categories: parsed.categories || ['化學高一', '化學高二', '化學高三']
    };
  } catch (error) {
    console.error("後端讀取 JSON 檔案失敗:", error);
    return { steps: [], categories: ['化學高一', '化學高二', '化學高三'] };
  }
}

// 輔助函式：安全寫入檔案
function writeDataToFile(data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("後端寫入 JSON 檔案失敗:", error);
  }
}

// 1. GET: 獲取所有文章與分類
export async function GET() {
  const data = readDataFromFile();
  return NextResponse.json(data);
}

// 2. POST: 建立新文章或新增分類
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const db = readDataFromFile();

    // 處理新增分類的請求
    if (payload.action === 'addCategory') {
      const newCat = payload.categoryName?.trim();
      if (!newCat) {
        return NextResponse.json({ message: '分類名稱不能為空' }, { status: 400 });
      }
      if (!db.categories.includes(newCat)) {
        db.categories.push(newCat);
        writeDataToFile(db);
      }
      return NextResponse.json({ message: '分類新增成功', categories: db.categories }, { status: 201 });
    }

    // 處理刪除分類的請求
    if (payload.action === 'deleteCategory') {
      const targetCat = payload.categoryName;
      db.categories = db.categories.filter((c: string) => c !== targetCat);
      writeDataToFile(db);
      return NextResponse.json({ message: '分類刪除成功', categories: db.categories }, { status: 200 });
    }

    // 處理一般文章發布
    if (!payload.courseName || !payload.title || !payload.description) {
      return NextResponse.json({ message: '缺少必要欄位(分類、標題或內文)' }, { status: 400 });
    }

    const newCourse = {
      id: payload.id || Date.now().toString(),
      courseName: payload.courseName,
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl || '',
      videoUrl: payload.videoUrl || '',
      links: payload.links || []
    };

    db.steps.unshift(newCourse);
    writeDataToFile(db);

    return NextResponse.json({ message: '文章發布成功', data: newCourse }, { status: 201 });
  } catch (error) {
    console.error("後端 POST 發生錯誤:", error);
    return NextResponse.json({ message: '伺服器解析請求失敗' }, { status: 500 });
  }
}

// 3. DELETE: 刪除文章
export async function DELETE(request: Request) {
  try {
    const payload = await request.json();
    const clientKey = (payload.secretKey || payload.password || "").toString().trim();
    const TEACHER_SECRET_KEY = 'teacher777';

    if (clientKey !== TEACHER_SECRET_KEY) {
      return NextResponse.json({ message: '管理密鑰驗證失敗!' }, { status: 403 });
    }

    if (!payload.id) {
      return NextResponse.json({ message: '刪除失敗:未提供文章 ID' }, { status: 400 });
    }

    const db = readDataFromFile();
    const updatedSteps = db.steps.filter((item: any) => item.id.toString() !== payload.id.toString());
    
    db.steps = updatedSteps;
    writeDataToFile(db);

    return NextResponse.json({ message: '資料永久刪除成功' }, { status: 200 });
  } catch (error) {
    console.error("後端 DELETE 函式崩潰:", error);
    return NextResponse.json({ message: '伺服器發生未知的解析錯誤' }, { status: 500 });
  }
}