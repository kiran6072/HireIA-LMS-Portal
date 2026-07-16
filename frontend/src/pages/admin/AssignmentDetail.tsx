import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import * as assignmentService from '@/api/assignmentService';
import { getErrorMessage } from '@/api/axios';
import type { Assignment, Submission } from '@/types';

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const data = await assignmentService.getAssignment(id);
      setAssignment(data.assignment);
      setSubmissions(data.submissions || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Assignment">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout role="admin" title="Assignment">
        <p className="text-sm text-slate-500">Assignment not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Assignment Details">
      <Link to="/admin/assignments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to Assignments
      </Link>

      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
              {typeof assignment.course === 'object' ? assignment.course.title : ''}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{assignment.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{assignment.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={14} /> Due {new Date(assignment.dueDate).toLocaleString()}
            </span>
            <span className="font-semibold text-primary-700">{assignment.maxMarks} marks</span>
            {assignment.questionFileUrl && (
              <a href={assignment.questionFileUrl} target="_blank" rel="noreferrer" className="btn-outline px-3 py-1.5 text-xs">
                <Download size={13} /> Question File
              </a>
            )}
          </div>
        </div>
      </div>

      <h3 className="mb-4 font-semibold text-slate-800">Submissions ({submissions.length})</h3>
      {submissions.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">No submissions yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => {
                const student = typeof s.student === 'object' ? s.student : null;
                return (
                  <tr key={s._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{student?.name}</p>
                      <p className="text-xs text-slate-400">{student?.studentId}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(s.submittedAt).toLocaleString()}
                      {s.isLate && <span className="ml-2 badge bg-amber-50 text-amber-600">late</span>}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {s.grade !== null ? `${s.grade}/${assignment.maxMarks}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <a href={s.submissionFileUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs">
                          <FileText size={13} /> File
                        </a>
                        <button className="btn-outline px-2.5 py-1.5 text-xs" onClick={() => setGradeTarget(s)}>
                          Grade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {gradeTarget && (
        <GradeModal
          submission={gradeTarget}
          maxMarks={assignment.maxMarks}
          onClose={() => setGradeTarget(null)}
          onGraded={() => {
            setGradeTarget(null);
            load();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function GradeModal({
  submission,
  maxMarks,
  onClose,
  onGraded,
}: {
  submission: Submission;
  maxMarks: number;
  onClose: () => void;
  onGraded: () => void;
}) {
  const [grade, setGrade] = useState(submission.grade?.toString() ?? '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (requestResubmit = false) => {
    setIsSubmitting(true);
    try {
      await assignmentService.gradeSubmission(submission._id, {
        grade: requestResubmit ? undefined : Number(grade),
        feedback,
        requestResubmit,
      });
      toast.success(requestResubmit ? 'Resubmission requested.' : 'Submission graded.');
      onGraded();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const student = typeof submission.student === 'object' ? submission.student : null;

  return (
    <Modal isOpen onClose={onClose} title={`Grade Submission — ${student?.name || ''}`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Grade (out of {maxMarks})</label>
          <input
            type="number"
            min={0}
            max={maxMarks}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input"
            placeholder="e.g. 85"
          />
        </div>
        <div>
          <label className="label">Feedback</label>
          <textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="input" placeholder="Write feedback for the student…" />
        </div>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={() => submit(true)} disabled={isSubmitting}>
            Request Resubmission
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => submit(false)}
            disabled={isSubmitting || grade === ''}
          >
            {isSubmitting ? 'Saving…' : 'Save Grade'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
