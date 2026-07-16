import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import FileDropzone from '@/components/common/FileDropzone';
import * as assignmentService from '@/api/assignmentService';
import { getErrorMessage } from '@/api/axios';
import type { Assignment, Submission } from '@/types';

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const data = await assignmentService.getAssignment(id);
      setAssignment(data.assignment);
      setMySubmission(data.mySubmission);
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

  const handleSubmit = async () => {
    if (!id || !file) {
      toast.error('Please select a file to submit.');
      return;
    }
    setIsSubmitting(true);
    try {
      await assignmentService.submitAssignment(id, file);
      toast.success('Assignment submitted successfully!');
      setFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student" title="Assignment">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout role="student" title="Assignment">
        <p className="text-sm text-slate-500">Assignment not found.</p>
      </DashboardLayout>
    );
  }

  const isPastDue = new Date(assignment.dueDate) < new Date();
  const canSubmit = !mySubmission || mySubmission.status === 'resubmit_requested';

  return (
    <DashboardLayout role="student" title="Assignment">
      <Link to="/student/assignments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to Assignments
      </Link>

      <div className="card mb-6 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
          {typeof assignment.course === 'object' ? assignment.course.title : ''}
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-800">{assignment.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{assignment.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className={`flex items-center gap-1.5 ${isPastDue ? 'text-red-500' : 'text-slate-500'}`}>
            <Calendar size={14} /> Due {new Date(assignment.dueDate).toLocaleString()}
          </span>
          <span className="font-semibold text-primary-700">{assignment.maxMarks} marks</span>
          {assignment.questionFileUrl && (
            <a href={assignment.questionFileUrl} target="_blank" rel="noreferrer" className="btn-outline px-3 py-1.5 text-xs">
              <Download size={13} /> Download Question
            </a>
          )}
        </div>
      </div>

      {mySubmission && (
        <div className="card mb-6 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Your Submission</h3>
            <StatusBadge status={mySubmission.status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">Submitted {new Date(mySubmission.submittedAt).toLocaleString()}</p>
          <a href={mySubmission.submissionFileUrl} target="_blank" rel="noreferrer" className="btn-outline mt-3 inline-flex text-xs">
            <Download size={13} /> View Your Submission
          </a>

          {mySubmission.status === 'graded' && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> Grade: {mySubmission.grade}/{assignment.maxMarks}
              </p>
              {mySubmission.feedback && (
                <p className="mt-2 flex items-start gap-2 text-sm text-emerald-800">
                  <MessageSquare size={14} className="mt-0.5 shrink-0" /> {mySubmission.feedback}
                </p>
              )}
            </div>
          )}

          {mySubmission.status === 'resubmit_requested' && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-700">Resubmission Requested</p>
              {mySubmission.feedback && <p className="mt-1 text-sm text-amber-800">{mySubmission.feedback}</p>}
            </div>
          )}
        </div>
      )}

      {canSubmit && (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-slate-800">{mySubmission ? 'Resubmit Your Work' : 'Submit Your Work'}</h3>
          <FileDropzone accept=".pdf,.doc,.docx,.zip" onFileSelect={setFile} label="Click or drop your submission file" />
          <button onClick={handleSubmit} disabled={isSubmitting || !file} className="btn-primary mt-4">
            {isSubmitting ? 'Submitting…' : 'Submit Assignment'}
          </button>
          {isPastDue && <p className="mt-2 text-xs text-amber-600">Note: the due date has passed — this will be marked as a late submission.</p>}
        </div>
      )}
    </DashboardLayout>
  );
}
