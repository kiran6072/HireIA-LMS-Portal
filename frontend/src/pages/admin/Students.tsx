import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, MoreVertical, Power, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import * as userService from '@/api/userService';
import * as authService from '@/api/authService';
import { getErrorMessage } from '@/api/axios';
import type { User } from '@/types';

export default function Students() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await userService.getStudents(search ? { search } : undefined);
      setStudents(data.students);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleActive = async (s: User) => {
    try {
      await userService.toggleStudentActive(s._id);
      toast.success(`${s.name} ${s.isActive ? 'deactivated' : 'activated'}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setMenuOpenId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userService.deleteStudent(deleteTarget._id);
      toast.success('Student removed.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout role="admin" title="Students">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="input pl-10"
          />
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={UserPlus} title="No students found" description="Add your first student to get started." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Batch</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.studentId}</td>
                    <td className="px-5 py-3 text-slate-600">{s.batch || '—'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="relative px-5 py-3 text-right">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === s._id ? null : s._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpenId === s._id && (
                        <div className="absolute right-5 top-10 z-10 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-elevated">
                          <Link
                            to={`/admin/students/${s._id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Eye size={14} /> View Profile
                          </Link>
                          <button
                            onClick={() => toggleActive(s)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Power size={14} /> {s.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(s);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateStudentModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove student"
        message={`Are you sure you want to remove ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Remove"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}

function CreateStudentModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', batch: '', course: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authService.adminCreateStudent(form);
      toast.success('Student account created.');
      setForm({ name: '', email: '', password: '', phone: '', batch: '', course: '' });
      onClose();
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input name="name" required value={form.name} onChange={handleChange} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input name="password" type="text" required value={form.password} onChange={handleChange} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Batch</label>
            <input name="batch" placeholder="e.g. 2026-A" value={form.batch} onChange={handleChange} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Track / Course focus</label>
          <input name="course" placeholder="e.g. Full Stack Development" value={form.course} onChange={handleChange} className="input" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating…' : 'Create Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
