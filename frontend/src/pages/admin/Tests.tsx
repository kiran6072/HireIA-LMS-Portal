import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileQuestion, Clock, BarChart2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import * as testService from '@/api/testService';
import { getErrorMessage } from '@/api/axios';
import type { Test } from '@/types';

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await testService.getTests();
      setTests(data.tests);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await testService.deleteTest(deleteTarget._id);
      toast.success('Test deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout role="admin" title="Online Tests">
      <div className="mb-5 flex justify-end">
        <Link to="/admin/tests/new" className="btn-primary">
          <Plus size={16} /> New MCQ Test
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : tests.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No tests yet" description="Create your first MCQ test for a course." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => (
            <div key={t._id} className="card p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
                  {typeof t.course === 'object' ? t.course.title : ''}
                </p>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="mt-1 font-semibold text-slate-800 line-clamp-1">{t.title}</h3>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {t.durationMinutes} min
                </span>
                <span>{t.questions.length} questions</span>
                <span>Pass: {t.passingPercent}%</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/admin/tests/${t._id}/results`} className="btn-outline flex-1 py-2 text-xs">
                  <BarChart2 size={14} /> Results
                </Link>
                <Link to={`/admin/tests/${t._id}/edit`} className="btn-outline flex-1 py-2 text-xs">
                  Edit
                </Link>
                <button onClick={() => setDeleteTarget(t)} className="btn-outline px-2.5 py-2 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete test"
        message={`Delete "${deleteTarget?.title}" and all student attempts? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </DashboardLayout>
  );
}
