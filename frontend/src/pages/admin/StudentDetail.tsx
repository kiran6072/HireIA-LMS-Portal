import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import * as userService from '@/api/userService';
import { getErrorMessage } from '@/api/axios';
import type { User, Course, Progress } from '@/types';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    if (!id) return;
    userService
      .getStudent(id)
      .then((data) => {
        setStudent(data.student);
        setCourses(data.courses);
        setProgress(data.progress);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const progressFor = (courseId: string) => progress.find((p) => p.course === courseId)?.percentComplete ?? 0;

  return (
    <DashboardLayout role="admin" title="Student Profile">
      <Link to="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to Students
      </Link>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : student ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-800">{student.name}</h2>
              <p className="font-mono text-xs text-slate-400">{student.studentId}</p>
              <div className="mt-2">
                <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <Mail size={15} className="text-slate-400" /> {student.email}
              </div>
              {student.phone && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Phone size={15} className="text-slate-400" /> {student.phone}
                </div>
              )}
              {student.batch && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Batch</span>
                  <span className="font-medium text-slate-700">{student.batch}</span>
                </div>
              )}
              {student.course && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Track</span>
                  <span className="font-medium text-slate-700">{student.course}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Joined</span>
                <span className="font-medium text-slate-700">{new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="card p-6 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <BookOpen size={17} /> Enrolled Courses & Progress
            </h3>
            {courses.length === 0 ? (
              <p className="text-sm text-slate-400">Not enrolled in any courses yet.</p>
            ) : (
              <div className="space-y-4">
                {courses.map((c) => (
                  <div key={c._id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{c.title}</p>
                      <span className="text-sm font-semibold text-primary-700">{progressFor(c._id)}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${progressFor(c._id)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Student not found.</p>
      )}
    </DashboardLayout>
  );
}
