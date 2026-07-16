import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import * as assignmentService from '@/api/assignmentService';
import { getErrorMessage } from '@/api/axios';
import type { Assignment } from '@/types';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentService
      .getAssignments()
      .then((d) => setAssignments(d.assignments))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const statusFor = (a: Assignment) => {
    if (a.mySubmission) return a.mySubmission.status;
    return new Date(a.dueDate) < new Date() ? 'rejected' : 'draft';
  };
  const labelFor = (a: Assignment) => {
    if (a.mySubmission) return a.mySubmission.status.replace('_', ' ');
    return new Date(a.dueDate) < new Date() ? 'overdue' : 'not submitted';
  };

  return (
    <DashboardLayout role="student" title="Assignments">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Your assignments will appear here once posted." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <Link key={a._id} to={`/student/assignments/${a._id}`} className="card p-5 transition-shadow hover:shadow-elevated">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
                  {typeof a.course === 'object' ? a.course.title : ''}
                </p>
                <span className={`badge ${a.mySubmission?.status === 'graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {labelFor(a)}
                </span>
              </div>
              <h3 className="mt-1 font-semibold text-slate-800 line-clamp-1">{a.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> Due {new Date(a.dueDate).toLocaleDateString()}
                </span>
                {a.mySubmission?.grade != null && (
                  <span className="font-semibold text-primary-700">
                    {a.mySubmission.grade}/{a.maxMarks}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
