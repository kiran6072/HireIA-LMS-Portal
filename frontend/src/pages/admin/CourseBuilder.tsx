import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Video,
  FileText,
  FileType,
  Archive,
  StickyNote,
  Trash2,
  Users,
  Rocket,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FileDropzone from '@/components/common/FileDropzone';
import * as courseService from '@/api/courseService';
import * as userService from '@/api/userService';
import { getErrorMessage } from '@/api/axios';
import type { Course, CourseModule, Lesson, User } from '@/types';

const LESSON_ICONS: Record<Lesson['type'], typeof Video> = {
  video: Video,
  pdf: FileText,
  docx: FileType,
  ppt: FileType,
  zip: Archive,
  notes: StickyNote,
};

export default function CourseBuilder() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalModuleId, setLessonModalModuleId] = useState<string | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<CourseModule | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const data = await courseService.getCourse(id);
      setCourse(data.course);
      setExpandedModules(new Set(data.course.modules.map((m) => m._id)));
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

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const togglePublish = async () => {
    if (!course) return;
    try {
      const newStatus = course.status === 'published' ? 'draft' : 'published';
      await courseService.publishCourse(course._id, newStatus);
      toast.success(newStatus === 'published' ? 'Course published! Students notified.' : 'Course moved to draft.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    try {
      await courseService.deleteLesson(deleteLessonTarget._id);
      toast.success('Lesson deleted.');
      setDeleteLessonTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModuleTarget) return;
    try {
      await courseService.deleteModule(deleteModuleTarget._id);
      toast.success('Module deleted.');
      setDeleteModuleTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Course Builder">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout role="admin" title="Course Builder">
        <p className="text-sm text-slate-500">Course not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Course Builder">
      <Link to="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to Courses
      </Link>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-800">{course.title}</h2>
            <StatusBadge status={course.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {course.category} • {course.level} • {course.durationWeeks} weeks •{' '}
            {course.enrolledStudents.length} students enrolled
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setEnrollModalOpen(true)}>
            <Users size={16} /> Enroll Students
          </button>
          <button className={course.status === 'published' ? 'btn-outline' : 'btn-secondary'} onClick={togglePublish}>
            <Rocket size={16} /> {course.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Course Content</h3>
        <button className="btn-primary" onClick={() => setModuleModalOpen(true)}>
          <Plus size={16} /> Add Module
        </button>
      </div>

      {course.modules.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">No modules yet. Add your first module to begin.</div>
      ) : (
        <div className="space-y-3">
          {course.modules.map((module, mIdx) => (
            <div key={module._id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <button onClick={() => toggleModule(module._id)} className="flex flex-1 items-center gap-2.5 text-left">
                  {expandedModules.has(module._id) ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                  <GripVertical size={14} className="text-slate-300" />
                  <span className="font-medium text-slate-800">
                    Module {mIdx + 1}: {module.title}
                  </span>
                  <span className="text-xs text-slate-400">({module.lessons.length} lessons)</span>
                </button>
                <div className="flex gap-2">
                  <button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => setLessonModalModuleId(module._id)}>
                    <Plus size={14} /> Lesson
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    onClick={() => setDeleteModuleTarget(module)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expandedModules.has(module._id) && (
                <div className="divide-y divide-slate-50 border-t border-slate-100 bg-slate-50/50">
                  {module.lessons.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-slate-400">No lessons in this module yet.</p>
                  ) : (
                    module.lessons.map((lesson, lIdx) => {
                      const Icon = LESSON_ICONS[lesson.type];
                      return (
                        <div key={lesson._id} className="flex items-center justify-between px-4 py-3 pl-11">
                          <div className="flex items-center gap-3">
                            <Icon size={16} className="text-primary-500" />
                            <span className="text-sm text-slate-700">
                              {lIdx + 1}. {lesson.title}
                            </span>
                            <span className="badge bg-slate-100 text-slate-500">{lesson.type}</span>
                            {lesson.isPreview && <span className="badge bg-secondary-50 text-secondary-600">preview</span>}
                          </div>
                          <button
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            onClick={() => setDeleteLessonTarget(lesson)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddModuleModal isOpen={moduleModalOpen} onClose={() => setModuleModalOpen(false)} courseId={course._id} onCreated={load} />

      {lessonModalModuleId && (
        <AddLessonModal
          isOpen
          onClose={() => setLessonModalModuleId(null)}
          moduleId={lessonModalModuleId}
          onCreated={load}
        />
      )}

      <EnrollStudentsModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        course={course}
        onEnrolled={load}
      />

      <ConfirmDialog
        isOpen={!!deleteLessonTarget}
        onClose={() => setDeleteLessonTarget(null)}
        onConfirm={handleDeleteLesson}
        title="Delete lesson"
        message={`Delete "${deleteLessonTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
      <ConfirmDialog
        isOpen={!!deleteModuleTarget}
        onClose={() => setDeleteModuleTarget(null)}
        onConfirm={handleDeleteModule}
        title="Delete module"
        message={`Delete "${deleteModuleTarget?.title}" and all its lessons? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </DashboardLayout>
  );
}

function AddModuleModal({
  isOpen,
  onClose,
  courseId,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await courseService.createModule(courseId, { title, description });
      toast.success('Module added.');
      setTitle('');
      setDescription('');
      onClose();
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Module" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Module title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Introduction to React" />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Adding…' : 'Add Module'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const LESSON_TYPE_OPTIONS: { value: Lesson['type']; label: string; accept?: string }[] = [
  { value: 'video', label: 'Video', accept: 'video/*' },
  { value: 'pdf', label: 'PDF Document', accept: '.pdf' },
  { value: 'docx', label: 'Word Document (DOCX)', accept: '.doc,.docx' },
  { value: 'ppt', label: 'Presentation (PPT)', accept: '.ppt,.pptx' },
  { value: 'zip', label: 'ZIP Archive', accept: '.zip' },
  { value: 'notes', label: 'Text Notes', accept: undefined },
];

function AddLessonModal({
  isOpen,
  onClose,
  moduleId,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Lesson['type']>('video');
  const [notesContent, setNotesContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = LESSON_TYPE_OPTIONS.find((o) => o.value === type)!;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (type !== 'notes' && !file) {
      toast.error('Please select a file to upload.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('type', type);
      fd.append('isPreview', String(isPreview));
      if (type === 'notes') fd.append('notesContent', notesContent);
      else if (type === 'video') fd.append('video', file as File);
      else fd.append('document', file as File);

      await courseService.createLesson(moduleId, fd);
      toast.success('Lesson added.');
      setTitle('');
      setFile(null);
      setNotesContent('');
      onClose();
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Lesson">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Lesson title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Content type</label>
          <div className="grid grid-cols-3 gap-2">
            {LESSON_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setType(opt.value);
                  setFile(null);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  type === opt.value ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {type === 'notes' ? (
          <div>
            <label className="label">Notes content</label>
            <textarea
              required
              rows={6}
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              className="input"
              placeholder="Write the lesson notes here…"
            />
          </div>
        ) : (
          <div>
            <label className="label">Upload {selectedOption.label}</label>
            <FileDropzone accept={selectedOption.accept} onFileSelect={setFile} label={`Click or drop your ${selectedOption.label.toLowerCase()}`} />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="rounded border-slate-300" />
          Allow free preview (visible without enrollment)
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Uploading…' : 'Add Lesson'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EnrollStudentsModal({
  isOpen,
  onClose,
  course,
  onEnrolled,
}: {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onEnrolled: () => void;
}) {
  const [students, setStudents] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    userService
      .getStudents()
      .then((data) => setStudents(data.students))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (selected.size === 0) return;
    setIsSubmitting(true);
    try {
      await courseService.enrollStudents(course._id, Array.from(selected));
      toast.success(`${selected.size} student(s) enrolled.`);
      setSelected(new Set());
      onClose();
      onEnrolled();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const alreadyEnrolled = new Set(course.enrolledStudents);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enroll Students in "${course.title}"`}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100">
            {students.map((s) => {
              const enrolled = alreadyEnrolled.has(s._id);
              return (
                <label
                  key={s._id}
                  className={`flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 ${
                    enrolled ? 'opacity-50' : 'cursor-pointer hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={enrolled}
                    checked={selected.has(s._id) || enrolled}
                    onChange={() => toggle(s._id)}
                    className="rounded border-slate-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                  {enrolled && <span className="text-xs text-slate-400">Enrolled</span>}
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleEnroll} disabled={isSubmitting || selected.size === 0}>
              {isSubmitting ? 'Enrolling…' : `Enroll ${selected.size || ''} Student(s)`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
