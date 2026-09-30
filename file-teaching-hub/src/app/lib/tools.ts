export interface DownloadTool {
  id: string;
  name: string;
  description: string;
  path: string;
  downloadPath?: string;
  downloadFileName?: string;
}

export const downloadTools: DownloadTool[] = [
  {
    id: 'seat-planner',
    name: '高校座位表達人',
    description: '離線座位編排工具，支援隨機安排、特定同學固定座位、拆散群體與 PNG 匯出。',
    path: '/tools/seat-planner/',
    downloadPath: '/downloads/seat-planner.zip',
    downloadFileName: '高校座位表達人_離線版.zip',
  },
];