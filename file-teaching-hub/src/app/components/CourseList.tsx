'use client';
import CourseCard from './CourseCard';
import { Course } from '../lib/types';

interface CourseListProps {
  courses: Course[];
  categories: string[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onUpdate: (id: string, fields: any, files?: any) => Promise<void>;
}

export default function CourseList({ courses, categories, isAdmin, onDelete, onTogglePin, onUpdate }: CourseListProps) {
  if (!courses || courses.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 font-bold">
        目前沒有發布的文章。
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          categories={categories}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}