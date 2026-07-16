import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, BookOpen, Users, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import FileDropzone from '@/components/common/FileDropzone';
import * as courseService from '@/api/courseService';
import { getErrorMessage } from '@/api/axios';
import type { Course } from '@/types';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses(search ? { search } : undefined);
      setCourses(data.courses);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await courseService.deleteCourse(deleteTarget._id);
      toast.success('Course deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout role="admin" title="Courses">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="input pl-10" />
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New Course
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to start building content." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div key={c._id} className="card group overflow-hidden">
              <div className="relative h-36 w-full bg-gradient-to-br from-primary-700 to-primary-900">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen size={32} className="text-white/40" />
                  </div>
                )}
                <div className="absolute right-3 top-3">
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <div className="p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-secondary-600">{c.category}</p>
                <h3 className="font-semibold text-slate-800 line-clamp-1">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {c.studentCount ?? c.enrolledStudents?.length ?? 0} enrolled
                  </span>
                  <span>{c.level}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/admin/courses/${c._id}`} className="btn-outline flex-1 py-2 text-xs">
                    <Eye size={14} /> Manage
                  </Link>
                  <button onClick={() => setDeleteTarget(c)} className="btn-outline px-2.5 py-2 text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCourseModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete course"
        message={`Delete "${deleteTarget?.title}" and all its modules, lessons, assignments progress? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}

function CreateCourseModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'General', level: 'Beginner', durationWeeks: '4' });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (thumbnail) fd.append('thumbnail', thumbnail);
      await courseService.createCourse(fd);
      toast.success('Course created as draft.');
      setForm({ title: '', description: '', category: 'General', level: 'Beginner', durationWeeks: '4' });
      setThumbnail(null);
      onClose();
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Course">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Course title</label>
          <input name="title" required value={form.title} onChange={handleChange} className="input" placeholder="e.g. Full Stack Web Development" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" required rows={3} value={form.description} onChange={handleChange} className="input" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Category</label>
            <input name="category" value={form.category} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Level</label>
            <select name="level" value={form.level} onChange={handleChange} className="input">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="label">Duration (weeks)</label>
            <input name="durationWeeks" type="number" min={1} value={form.durationWeeks} onChange={handleChange} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Thumbnail image (optional)</label>
          <FileDropzone accept="image/*" onFileSelect={setThumbnail} label="Click or drop an image" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating…' : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
