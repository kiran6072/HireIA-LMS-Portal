import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FileQuestion, Award, Briefcase, TrendingUp, ArrowRight, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import * as dashboardService from '@/api/dashboardService';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [coursesWithProgress, setCoursesWithProgress] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [recentPlacements, setRecentPlacements] = useState<any[]>([]);

  useEffect(() => {
    dashboardService
      .getStudentDashboard()
      .then((data: any) => {
        setSummary(data.summary);
        setCoursesWithProgress(data.coursesWithProgress);
        setPendingAssignments(data.pendingAssignments);
        setUpcomingTests(data.upcomingTests);
        setRecentPlacements(data.recentPlacements);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = summary
    ? [
        { label: 'Enrolled Courses', value: summary.enrolledCourses, icon: BookOpen, to: '/student/courses' },
        { label: 'Avg. Progress', value: `${summary.avgProgress}%`, icon: TrendingUp, to: '/student/courses' },
        { label: 'Pending Assignments', value: summary.pendingAssignments, icon: ClipboardList, to: '/student/assignments' },
        { label: 'Upcoming Tests', value: summary.upcomingTests, icon: FileQuestion, to: '/student/tests' },
        { label: 'Certificates', value: summary.certificatesEarned, icon: Award, to: '/student/certificates' },
        { label: 'Placement Activity', value: summary.activePlacements, icon: Briefcase, to: '/student/placements' },
      ]
    : [];

  return (
    <DashboardLayout role="student" title="Dashboard">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-primary-800 to-primary-700 p-6 text-white">
            <h2 className="font-display text-xl font-bold">Welcome back, {user?.name.split(' ')[0]}! 👋</h2>
            <p className="mt-1 text-sm text-primary-200">Here's what's happening with your learning journey today.</p>
          </div>

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
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">My Courses</h3>
                <Link to="/student/courses" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {coursesWithProgress.length === 0 && <p className="text-sm text-slate-400">Not enrolled in any courses yet.</p>}
                {coursesWithProgress.slice(0, 4).map((c) => (
                  <Link key={c._id} to={`/student/courses/${c._id}`} className="block rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{c.title}</p>
                      <span className="text-xs font-semibold text-primary-700">{c.percentComplete}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${c.percentComplete}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Pending Assignments</h3>
                <Link to="/student/assignments" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {pendingAssignments.length === 0 && <p className="text-sm text-slate-400">No pending assignments. Nice work!</p>}
                {pendingAssignments.map((a) => (
                  <Link key={a._id} to={`/student/assignments/${a._id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50">
                    <p className="text-sm text-slate-700">{a.title}</p>
                    <span className="flex items-center gap-1 text-xs text-secondary-600">
                      <Calendar size={12} /> {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Upcoming Tests</h3>
                <Link to="/student/tests" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingTests.length === 0 && <p className="text-sm text-slate-400">No tests scheduled right now.</p>}
                {upcomingTests.map((t) => (
                  <Link key={t._id} to="/student/tests" className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50">
                    <p className="text-sm text-slate-700">{t.title}</p>
                    <span className="text-xs text-slate-400">{t.durationMinutes} min</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Placement Activity</h3>
                <Link to="/student/placements" className="text-xs font-medium text-primary-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentPlacements.length === 0 && <p className="text-sm text-slate-400">No placement activity yet.</p>}
                {recentPlacements.map((p) => (
                  <div key={p._id} className="flex items-center justify-between rounded-lg p-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {p.role} at {p.company}
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
