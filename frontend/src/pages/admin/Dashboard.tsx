import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, FileQuestion, Award, Briefcase, ArrowRight, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import * as dashboardService from '@/api/dashboardService';

interface Summary {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalAssignments: number;
  pendingGrading: number;
  totalTests: number;
  totalAttempts: number;
  totalCertificates: number;
  totalPlacements: number;
  studentsPlacedCount: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentPlacements, setRecentPlacements] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    dashboardService
      .getAdminDashboard()
      .then((data: any) => {
        setSummary(data.summary);
        setRecentStudents(data.recentStudents);
        setRecentCourses(data.recentCourses);
        setRecentPlacements(data.recentPlacements);
        setRecentSubmissions(data.recentSubmissions);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = summary
    ? [
        { label: 'Total Students', value: summary.totalStudents, sub: `${summary.activeStudents} active`, icon: Users, to: '/admin/students' },
        { label: 'Courses', value: summary.totalCourses, sub: `${summary.publishedCourses} published`, icon: BookOpen, to: '/admin/courses' },
        { label: 'Assignments', value: summary.totalAssignments, sub: `${summary.pendingGrading} pending grading`, icon: ClipboardList, to: '/admin/assignments' },
        { label: 'MCQ Tests', value: summary.totalTests, sub: `${summary.totalAttempts} attempts taken`, icon: FileQuestion, to: '/admin/tests' },
        { label: 'Certificates Issued', value: summary.totalCertificates, sub: 'QR-verified', icon: Award, to: '/admin/certificates' },
        { label: 'Placements', value: summary.totalPlacements, sub: `${summary.studentsPlacedCount} students placed`, icon: Briefcase, to: '/admin/placements' },
      ]
    : [];

  return (
    <DashboardLayout role="admin" title="Dashboard">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="card group p-5 transition-shadow hover:shadow-elevated">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <c.icon size={20} />
                  </div>
                  <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500" />
                </div>
                <p className="mt-4 text-2xl font-bold text-slate-800">{c.value}</p>
                <p className="text-sm font-medium text-slate-600">{c.label}</p>
                <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Recently Added Students</h3>
                <Link to="/admin/students" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentStudents.length === 0 && <p className="text-sm text-slate-400">No students yet.</p>}
                {recentStudents.map((s) => (
                  <Link
                    key={s._id}
                    to={`/admin/students/${s._id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="truncate text-xs text-slate-400">{s.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Recent Courses</h3>
                <Link to="/admin/courses" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentCourses.length === 0 && <p className="text-sm text-slate-400">No courses yet.</p>}
                {recentCourses.map((c) => (
                  <Link key={c._id} to={`/admin/courses/${c._id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{c.title}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Pending Grading</h3>
                <Link to="/admin/assignments" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentSubmissions.length === 0 && <p className="text-sm text-slate-400">Nothing pending. Great job!</p>}
                {recentSubmissions.map((s) => (
                  <Link
                    key={s._id}
                    to={`/admin/assignments/${s.assignment?._id}`}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{s.assignment?.title}</p>
                      <p className="truncate text-xs text-slate-400">by {s.student?.name}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <TrendingUp size={16} className="text-secondary-500" /> Recent Placement Activity
                </h3>
                <Link to="/admin/placements" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentPlacements.length === 0 && <p className="text-sm text-slate-400">No placement activity yet.</p>}
                {recentPlacements.map((p) => (
                  <div key={p._id} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {p.student?.name} &rarr; {p.role} at {p.company}
                      </p>
                      <p className="text-xs text-slate-400">₹{p.salaryLPA} LPA</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
