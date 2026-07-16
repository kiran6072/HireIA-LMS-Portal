import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  FileText,
  FileType,
  Archive,
  StickyNote,
  CheckCircle2,
  Circle,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import * as courseService from '@/api/courseService';
import { getErrorMessage } from '@/api/axios';
import type { Course, Lesson, Progress } from '@/types';

const LESSON_ICONS: Record<Lesson['type'], typeof Video> = {
  video: Video,
  pdf: FileText,
  docx: FileType,
  ppt: FileType,
  zip: Archive,
  notes: StickyNote,
};

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const data = await courseService.getCourse(id);
      setCourse(data.course);
      setProgress(data.progress);
      setExpandedModules(new Set(data.course.modules.map((m) => m._id)));
      if (!activeLesson) {
        const firstLesson = data.course.modules.find((m) => m.lessons.length > 0)?.lessons[0];
        if (firstLesson) setActiveLesson(firstLesson);
      }
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

  const isCompleted = (lessonId: string) => !!progress?.completedLessons.includes(lessonId);

  const handleMarkComplete = async (lessonId: string) => {
    setMarking(true);
    try {
      const data = await courseService.markLessonComplete(lessonId);
      setProgress(data.progress);
      toast.success('Marked as complete!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarking(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="student" title="Course">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout role="student" title="Course">
        <p className="text-sm text-slate-500">Course not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title={course.title}>
      <Link to="/student/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to My Courses
      </Link>

      <div className="mb-5 card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Course Progress</p>
          <span className="text-sm font-bold text-primary-700">{progress?.percentComplete ?? 0}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${progress?.percentComplete ?? 0}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <div className="card max-h-[70vh] overflow-y-auto">
          {course.modules.map((module, mIdx) => (
            <div key={module._id} className="border-b border-slate-100 last:border-0">
              <button onClick={() => toggleModule(module._id)} className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50">
                {expandedModules.has(module._id) ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                <span className="text-sm font-medium text-slate-800">
                  {mIdx + 1}. {module.title}
                </span>
              </button>
              {expandedModules.has(module._id) && (
                <div className="pb-2">
                  {module.lessons.map((lesson) => {
                    const Icon = LESSON_ICONS[lesson.type];
                    const completed = isCompleted(lesson._id);
                    return (
                      <button
                        key={lesson._id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`flex w-full items-center gap-2.5 py-2 pl-9 pr-4 text-left text-sm hover:bg-slate-50 ${
                          activeLesson?._id === lesson._id ? 'bg-primary-50 text-primary-700' : 'text-slate-600'
                        }`}
                      >
                        {completed ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" /> : <Circle size={15} className="shrink-0 text-slate-300" />}
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {activeLesson ? (
            <LessonViewer
              lesson={activeLesson}
              isCompleted={isCompleted(activeLesson._id)}
              onMarkComplete={() => handleMarkComplete(activeLesson._id)}
              marking={marking}
            />
          ) : (
            <p className="text-sm text-slate-400">Select a lesson to begin.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function LessonViewer({
  lesson,
  isCompleted,
  onMarkComplete,
  marking,
}: {
  lesson: Lesson;
  isCompleted: boolean;
  onMarkComplete: () => void;
  marking: boolean;
}) {
  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span className="badge bg-slate-100 text-slate-500">{lesson.type}</span>
          <h2 className="mt-2 text-lg font-bold text-slate-800">{lesson.title}</h2>
        </div>
        {!isCompleted ? (
          <button onClick={onMarkComplete} disabled={marking} className="btn-secondary shrink-0">
            <CheckCircle2 size={16} /> {marking ? 'Saving…' : 'Mark as Complete'}
          </button>
        ) : (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} /> Completed
          </span>
        )}
      </div>

      {lesson.type === 'video' && lesson.fileUrl && (
        <video controls className="w-full rounded-xl bg-black" src={lesson.fileUrl}>
          Your browser does not support the video tag.
        </video>
      )}

      {lesson.type === 'pdf' && lesson.fileUrl && (
        <iframe src={lesson.fileUrl} title={lesson.title} className="h-[70vh] w-full rounded-xl border border-slate-200" />
      )}

      {(lesson.type === 'docx' || lesson.type === 'ppt' || lesson.type === 'zip') && lesson.fileUrl && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <FileType size={36} className="mb-3 text-primary-400" />
          <p className="mb-4 text-sm text-slate-500">
            This {lesson.type.toUpperCase()} file can't be previewed inline. Download it to view the content.
          </p>
          <a href={lesson.fileUrl} target="_blank" rel="noreferrer" className="btn-primary">
            <Download size={16} /> Download {lesson.type.toUpperCase()}
          </a>
        </div>
      )}

      {lesson.type === 'notes' && (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
          {lesson.notesContent}
        </div>
      )}
    </div>
  );
}
