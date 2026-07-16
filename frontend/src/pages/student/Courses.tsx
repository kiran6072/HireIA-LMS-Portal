import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import * as courseService from '@/api/courseService';
import { getErrorMessage } from '@/api/axios';
import type { Course } from '@/types';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService
      .getCourses()
      .then((d) => setCourses(d.courses))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student" title="My Courses">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" description="Your administrator will enroll you in courses soon." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c._id} to={`/student/courses/${c._id}`} className="card group overflow-hidden transition-shadow hover:shadow-elevated">
              <div className="relative h-36 w-full bg-gradient-to-br from-primary-700 to-primary-900">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen size={32} className="text-white/40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-secondary-600">{c.category}</p>
                <h3 className="font-semibold text-slate-800 line-clamp-1">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{c.level}</span>
                  <span>{c.durationWeeks} weeks</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
