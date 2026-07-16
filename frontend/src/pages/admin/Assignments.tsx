import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import FileDropzone from '@/components/common/FileDropzone';
import * as assignmentService from '@/api/assignmentService';
import * as courseService from '@/api/courseService';
import { getErrorMessage } from '@/api/axios';
import type { Assignment, Course } from '@/types';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aData, cData] = await Promise.all([assignmentService.getAssignments(), courseService.getCourses()]);
      setAssignments(aData.assignments);
      setCourses(cData.courses);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout role="admin" title="Assignments">
      <div className="mb-5 flex justify-end">
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Create your first assignment for a course." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <Link key={a._id} to={`/admin/assignments/${a._id}`} className="card p-5 transition-shadow hover:shadow-elevated">
              <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
                {typeof a.course === 'object' ? a.course.title : ''}
              </p>
              <h3 className="mt-1 font-semibold text-slate-800 line-clamp-1">{a.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> Due {new Date(a.dueDate).toLocaleDateString()}
                </span>
                <span className="font-semibold text-primary-700">{a.maxMarks} marks</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateAssignmentModal isOpen={createOpen} onClose={() => setCreateOpen(false)} courses={courses} onCreated={load} />
    </DashboardLayout>
  );
}

function CreateAssignmentModal({
  isOpen,
  onClose,
  courses,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: '', description: '', course: '', maxMarks: '100', dueDate: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.course) {
      toast.error('Please select a course.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('questionFile', file);
      await assignmentService.createAssignment(fd);
      toast.success('Assignment created and students notified.');
      setForm({ title: '', description: '', course: '', maxMarks: '100', dueDate: '' });
      setFile(null);
      onClose();
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Course</label>
          <select name="course" required value={form.course} onChange={handleChange} className="input">
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Title</label>
          <input name="title" required value={form.title} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Description / Instructions</label>
          <textarea name="description" required rows={3} value={form.description} onChange={handleChange} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Max marks</label>
            <input name="maxMarks" type="number" min={1} value={form.maxMarks} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Due date</label>
            <input name="dueDate" type="datetime-local" required value={form.dueDate} onChange={handleChange} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Question file (optional)</label>
          <FileDropzone accept=".pdf,.doc,.docx,.zip" onFileSelect={setFile} label="Click or drop the question paper" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating…' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
