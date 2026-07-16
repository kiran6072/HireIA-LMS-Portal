import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import * as testService from '@/api/testService';
import { getErrorMessage } from '@/api/axios';
import type { Test } from '@/types';

interface AttemptRow {
  _id: string;
  student: { name: string; email: string; studentId: string };
  percent: number;
  scoredMarks: number;
  totalMarks: number;
  passed: boolean;
  attemptNumber: number;
  submittedAt: string;
  autoSubmitted: boolean;
}

export default function TestResults() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([testService.getTest(id), testService.getTestResults(id)])
      .then(([testData, resultsData]) => {
        setTest(testData.test);
        setAttempts(resultsData.attempts);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const avgPercent = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percent, 0) / attempts.length) : 0;
  const passCount = attempts.filter((a) => a.passed).length;

  return (
    <DashboardLayout role="admin" title="Test Results">
      <Link to="/admin/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to Tests
      </Link>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="card mb-6 p-6">
            <h2 className="text-xl font-bold text-slate-800">{test?.title}</h2>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-primary-50 p-4">
                <p className="text-2xl font-bold text-primary-700">{attempts.length}</p>
                <p className="text-xs text-slate-500">Attempts</p>
              </div>
              <div className="rounded-xl bg-secondary-50 p-4">
                <p className="text-2xl font-bold text-secondary-600">{avgPercent}%</p>
                <p className="text-xs text-slate-500">Average Score</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-2xl font-bold text-emerald-600">
                  {passCount}/{attempts.length}
                </p>
                <p className="text-xs text-slate-500">Passed</p>
              </div>
            </div>
          </div>

          {attempts.length === 0 ? (
            <EmptyState icon={Trophy} title="No attempts yet" description="Results will appear here once students take the test." />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Percent</th>
                    <th className="px-5 py-3">Result</th>
                    <th className="px-5 py-3">Attempt</th>
                    <th className="px-5 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{a.student?.name}</p>
                        <p className="text-xs text-slate-400">{a.student?.studentId}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {a.scoredMarks}/{a.totalMarks}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{a.percent}%</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={a.passed ? 'joined' : 'rejected'} />
                        {a.autoSubmitted && <span className="ml-2 text-xs text-slate-400">(auto-submitted)</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-500">#{a.attemptNumber}</td>
                      <td className="px-5 py-3 text-slate-500">{new Date(a.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
