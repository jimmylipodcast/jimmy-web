export interface Course {
  id: string;
  title: string;
  courseName: string;
  content: string;
  imageUrl?: string;
  imagePosition?: 'top' | 'bottom';
  videoUrl?: string;
  pdfUrls?: string[];
  pdfNames?: string[];
  createdAt: string;
  isPinned: boolean;
}