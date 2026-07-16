import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import * as testService from '@/api/testService';
import * as courseService from '@/api/courseService';
import { getErrorMessage } from '@/api/axios';
import type { Course } from '@/types';

interface DraftOption {
  text: string;
}
interface DraftQuestion {
  questionText: string;
  options: DraftOption[];
  correctOptionIndex: number;
  marks: number;
  explanation: string;
}

const emptyQuestion = (): DraftQuestion => ({
  questionText: '',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctOptionIndex: 0,
  marks: 1,
  explanation: '',
});

export default function TestBuilder() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState('0');
  const [passingPercent, setPassingPercent] = useState('40');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  useEffect(() => {
    courseService.getCourses().then((d) => setCourses(d.courses));
  }, []);

  useEffect(() => {
    if (!id) return;
    testService
      .getTest(id)
      .then((d) => {
        const t = d.test;
        setTitle(t.title);
        setDescription(t.description || '');
        setCourse(typeof t.course === 'object' ? t.course._id : t.course);
        setDurationMinutes(String(t.durationMinutes));
        setQuestionsPerAttempt(String(t.questionsPerAttempt));
        setPassingPercent(String(t.passingPercent));
        setMaxAttempts(String(t.maxAttempts));
        setStatus(t.status);
        setQuestions(
          t.questions.map((q) => ({
            questionText: q.questionText,
            options: q.options.map((o) => ({ text: o.text })),
            correctOptionIndex: q.correctOptionIndex ?? 0,
            marks: q.marks,
            explanation: q.explanation || '',
          }))
        );
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQuestion = (idx: number, patch: Partial<DraftQuestion>) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { text } : o)) } : q))
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((qs) => qs.map((q, i) => (i === qIdx && q.options.length < 6 ? { ...q, options: [...q.options, { text: '' }] } : q)));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx || q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, j) => j !== oIdx);
        const newCorrect = q.correctOptionIndex >= newOptions.length ? 0 : q.correctOptionIndex;
        return { ...q, options: newOptions, correctOptionIndex: newCorrect };
      })
    );
  };

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (idx: number) => setQuestions((qs) => (qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs));

  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required.';
    if (!course) return 'Please select a course.';
    for (const [i, q] of questions.entries()) {
      if (!q.questionText.trim()) return `Question ${i + 1} needs text.`;
      if (q.options.some((o) => !o.text.trim())) return `Question ${i + 1} has an empty option.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setIsSubmitting(true);
    const payload = {
      title,
      description,
      course,
      durationMinutes: Number(durationMinutes),
      questionsPerAttempt: Number(questionsPerAttempt),
      passingPercent: Number(passingPercent),
      maxAttempts: Number(maxAttempts),
      status,
      questions,
    };
    try {
      if (isEdit && id) {
        await testService.updateTest(id, payload);
        toast.success('Test updated.');
      } else {
        await testService.createTest(payload);
        toast.success('Test created and students notified.');
      }
      navigate('/admin/tests');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Test Builder">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title={isEdit ? 'Edit Test' : 'Create MCQ Test'}>
      <Link to="/admin/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
        <ArrowLeft size={15} /> Back to Tests
      </Link>

      <div className="card mb-6 space-y-4 p-6">
        <h3 className="font-semibold text-slate-800">Test Configuration</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Test title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="input">
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Random Qs / attempt</label>
            <input
              type="number"
              min={0}
              value={questionsPerAttempt}
              onChange={(e) => setQuestionsPerAttempt(e.target.value)}
              className="input"
              placeholder="0 = all"
            />
          </div>
          <div>
            <label className="label">Passing %</label>
            <input type="number" min={0} max={100} value={passingPercent} onChange={(e) => setPassingPercent(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Max attempts</label>
            <input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="input">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Questions ({questions.length})</h3>
        <button className="btn-outline" onClick={addQuestion}>
          <Plus size={15} /> Add Question
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="card p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <GripVertical size={15} className="text-slate-300" />
                <span className="font-medium text-slate-700">Question {qIdx + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => updateQuestion(qIdx, { marks: Number(e.target.value) })}
                  className="input w-20 py-1.5 text-center text-xs"
                  title="Marks"
                />
                <button onClick={() => removeQuestion(qIdx)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={q.questionText}
              onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
              className="input mb-3"
              placeholder="Enter the question text…"
            />

            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correctOptionIndex === oIdx}
                    onChange={() => updateQuestion(qIdx, { correctOptionIndex: oIdx })}
                    className="text-primary-600"
                    title="Mark as correct answer"
                  />
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    placeholder={`Option ${oIdx + 1}`}
                    className={`input flex-1 py-2 ${q.correctOptionIndex === oIdx ? 'border-emerald-300 bg-emerald-50/50' : ''}`}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(qIdx, oIdx)} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button onClick={() => addOption(qIdx)} className="text-xs font-medium text-primary-600 hover:underline">
                  + Add option
                </button>
              )}
            </div>

            <input
              value={q.explanation}
              onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
              placeholder="Explanation shown after submission (optional)"
              className="input mt-3 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-elevated">
        <button className="btn-outline" onClick={() => navigate('/admin/tests')}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Test'}
        </button>
      </div>
    </DashboardLayout>
  );
}
