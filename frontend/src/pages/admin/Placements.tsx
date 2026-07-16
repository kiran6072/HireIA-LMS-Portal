import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Briefcase, TrendingUp, Award, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import FileDropzone from '@/components/common/FileDropzone';
import * as placementService from '@/api/placementService';
import * as userService from '@/api/userService';
import { getErrorMessage } from '@/api/axios';
import type { Placement, PlacementStatus, User } from '@/types';
import type { PlacementStats } from '@/api/placementService';

const STATUS_OPTIONS: PlacementStatus[] = ['applied', 'interview_scheduled', 'interviewed', 'offered', 'rejected', 'joined'];

export default function Placements() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Placement | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        placementService.getPlacements(statusFilter ? { status: statusFilter } : undefined),
        placementService.getPlacementStats(),
      ]);
      setPlacements(pData.placements);
      setStats(sData.stats);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <DashboardLayout role="admin" title="Placement Dashboard">
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-primary-600">
              <Users size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Placed</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {stats.studentsPlaced}/{stats.totalStudents}
            </p>
            <p className="text-xs text-slate-400">{stats.placementRate}% placement rate</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-secondary-600">
              <Briefcase size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Drives</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800">{stats.totalDrives}</p>
            <p className="text-xs text-slate-400">total placement records</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Avg. Package</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800">₹{stats.avgSalaryLPA} LPA</p>
            <p className="text-xs text-slate-400">Highest: ₹{stats.highestSalaryLPA} LPA</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-primary-600">
              <Award size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Top Hirer</span>
            </div>
            <p className="mt-2 truncate text-lg font-bold text-slate-800">{stats.topCompanies[0]?.company || '—'}</p>
            <p className="text-xs text-slate-400">{stats.topCompanies[0]?.count || 0} hires</p>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:max-w-[220px]">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Add Placement Record
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : placements.length === 0 ? (
        <EmptyState icon={Briefcase} title="No placement records yet" description="Track student placement drives here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Salary</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {placements.map((p) => {
                const student = typeof p.student === 'object' ? p.student : null;
                return (
                  <tr key={p._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{student?.name}</p>
                      <p className="text-xs text-slate-400">{student?.studentId}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{p.company}</td>
                    <td className="px-5 py-3 text-slate-600">{p.role}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">₹{p.salaryLPA} LPA</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => setEditTarget(p)}>
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreatePlacementModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      {editTarget && <EditPlacementModal placement={editTarget} onClose={() => setEditTarget(null)} onUpdated={load} />}
    </DashboardLayout>
  );
}

function CreatePlacementModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [students, setStudents] = useState<User[]>([]);
  const [form, setForm] = useState({ studentId: '', company: '', role: '', salaryLPA: '', location: '', driveDate: '', notes: '' });
  const [offerLetter, setOfferLetter] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) userService.getStudents().then((d) => setStudents(d.students));
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      toast.error('Please select a student.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (offerLetter) fd.append('offerLetter', offerLetter);
      await placementService.createPlacement(fd);
      toast.success('Placement record created.');
      setForm({ studentId: '', company: '', role: '', salaryLPA: '', location: '', driveDate: '', notes: '' });
      setOfferLetter(null);
      onClose();
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Placement Record">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Student</label>
          <select name="studentId" required value={form.studentId} onChange={handleChange} className="input">
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.studentId})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Company</label>
            <input name="company" required value={form.company} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Role</label>
            <input name="role" required value={form.role} onChange={handleChange} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Salary (LPA)</label>
            <input name="salaryLPA" type="number" step="0.1" required value={form.salaryLPA} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Location</label>
            <input name="location" value={form.location} onChange={handleChange} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Drive date</label>
          <input name="driveDate" type="date" value={form.driveDate} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={2} value={form.notes} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Offer letter (optional)</label>
          <FileDropzone accept=".pdf,.doc,.docx" onFileSelect={setOfferLetter} label="Click or drop offer letter" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving…' : 'Add Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditPlacementModal({ placement, onClose, onUpdated }: { placement: Placement; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState<PlacementStatus>(placement.status);
  const [offerLetter, setOfferLetter] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const student = typeof placement.student === 'object' ? placement.student : null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (offerLetter) {
        const fd = new FormData();
        fd.append('status', status);
        fd.append('offerLetter', offerLetter);
        await placementService.updatePlacement(placement._id, fd);
      } else {
        await placementService.updatePlacement(placement._id, { status });
      }
      toast.success('Placement updated.');
      onClose();
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Update — ${student?.name}`} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          {placement.role} at <span className="font-medium text-slate-700">{placement.company}</span>
        </p>
        <div>
          <label className="label">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as PlacementStatus)} className="input">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Upload/replace offer letter</label>
          <FileDropzone accept=".pdf,.doc,.docx" onFileSelect={setOfferLetter} currentFileName={placement.offerLetterUrl ? 'offer-letter.pdf' : undefined} label="Click or drop offer letter" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
