import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Clock, RotateCcw, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import * as testService from '@/api/testService';
import { getErrorMessage } from '@/api/axios';
import type { Test } from '@/types';

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testService
      .getTests()
      .then((d) => setTests(d.tests))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student" title="Online Tests">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : tests.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No tests available" description="Check back later for upcoming MCQ tests." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => {
            const canAttempt = (t.attemptsRemaining ?? 1) > 0;
            return (
              <div key={t._id} className="card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
                  {typeof t.course === 'object' ? t.course.title : ''}
                </p>
                <h3 className="mt-1 font-semibold text-slate-800 line-clamp-1">{t.title}</h3>
                {t.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {t.durationMinutes} min
                  </span>
                  <span>{t.questionCount ?? t.questions.length} questions</span>
                  <span className="flex items-center gap-1">
                    <RotateCcw size={13} /> {t.attemptsRemaining ?? t.maxAttempts}/{t.maxAttempts} attempts left
                  </span>
                </div>
                {t.bestScorePercent != null && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <Trophy size={13} /> Best score: {t.bestScorePercent}%
                  </p>
                )}
                <Link
                  to={canAttempt ? `/student/tests/${t._id}/attempt` : '#'}
                  className={`mt-4 block text-center ${canAttempt ? 'btn-primary' : 'btn-outline pointer-events-none opacity-50'}`}
                >
                  {canAttempt ? (t.bestScorePercent != null ? 'Retake Test' : 'Start Test') : 'No attempts left'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
