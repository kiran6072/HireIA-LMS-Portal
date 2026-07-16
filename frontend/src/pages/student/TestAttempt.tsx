import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import * as testService from '@/api/testService';
import { getErrorMessage } from '@/api/axios';
import type { TestAttemptResult, TestReviewItem } from '@/types';

interface AttemptQuestion {
  _id: string;
  questionText: string;
  options: { _id: string; text: string }[];
  marks: number;
}

export default function TestAttempt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [result, setResult] = useState<{ result: TestAttemptResult; review: TestReviewItem[] } | null>(null);

  const submittedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    testService
      .startAttempt(id)
      .then((data) => {
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setRemainingSeconds(data.remainingSeconds);
        const initial: Record<string, number | null> = {};
        data.questions.forEach((q) => (initial[q._id] = null));
        setAnswers(initial);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
        navigate('/student/tests');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doSubmit = useCallback(
    async (autoSubmitted: boolean) => {
      if (!attemptId || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const payload = Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({ questionId, selectedOptionIndex }));
        const data = await testService.submitAttempt(attemptId, payload, autoSubmitted);
        setResult({ result: data.result, review: data.review });
      } catch (err) {
        toast.error(getErrorMessage(err));
        submittedRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [attemptId, answers]
  );

  // Countdown timer with auto-submit
  useEffect(() => {
    if (loading || result || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          doSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, result, doSubmit, remainingSeconds > 0]);

  // Warn before leaving mid-test
  useEffect(() => {
    if (result) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [result]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  if (loading) {
    return (
      <DashboardLayout role="student" title="Test">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (result) {
    return (
      <DashboardLayout role="student" title="Test Results">
        <div className="card mx-auto max-w-3xl p-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              result.result.passed ? 'bg-emerald-50' : 'bg-red-50'
            }`}
          >
            {result.result.passed ? <CheckCircle2 size={32} className="text-emerald-600" /> : <XCircle size={32} className="text-red-600" />}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{result.result.passed ? 'You Passed!' : 'Test Completed'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            You scored {result.result.scoredMarks} out of {result.result.totalMarks} ({result.result.percent}%). Passing score:{' '}
            {result.result.passingPercent}%.
          </p>
          <Link to="/student/tests" className="btn-primary mt-6 inline-flex">
            Back to Tests
          </Link>
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-4">
          <h3 className="font-semibold text-slate-800">Answer Review</h3>
          {result.review.map((r, idx) => (
            <div key={idx} className="card p-5">
              <p className="text-sm font-medium text-slate-800">
                {idx + 1}. {r.questionText}
              </p>
              <div className="mt-3 space-y-2">
                {r.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === r.correctOptionIndex;
                  const isSelected = oIdx === r.selectedOptionIndex;
                  return (
                    <div
                      key={opt._id}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : isSelected
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.text}
                      {isCorrect && <span className="ml-2 text-xs font-semibold">(Correct answer)</span>}
                      {isSelected && !isCorrect && <span className="ml-2 text-xs font-semibold">(Your answer)</span>}
                    </div>
                  );
                })}
              </div>
              {r.explanation && <p className="mt-2 text-xs italic text-slate-500">{r.explanation}</p>}
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const current = questions[currentIdx];
  const isLowTime = remainingSeconds <= 60;

  return (
    <DashboardLayout role="student" title="Test in Progress">
      <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5">
        <span className="text-sm text-slate-500">
          Question {currentIdx + 1} of {questions.length} • {answeredCount} answered
        </span>
        <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${isLowTime ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-700'}`}>
          <Clock size={15} /> {formatTime(remainingSeconds)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_200px]">
        <div className="card p-6">
          {current && (
            <>
              <p className="mb-5 text-base font-medium text-slate-800">{current.questionText}</p>
              <div className="space-y-3">
                {current.options.map((opt, oIdx) => (
                  <label
                    key={opt._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      answers[current._id] === oIdx ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={current._id}
                      checked={answers[current._id] === oIdx}
                      onChange={() => setAnswers((a) => ({ ...a, [current._id]: oIdx }))}
                      className="text-primary-600"
                    />
                    <span className="text-sm text-slate-700">{opt.text}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  className="btn-outline"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                >
                  <ArrowLeft size={15} /> Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button className="btn-primary" onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>
                    Next <ArrowRight size={15} />
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={() => setConfirmSubmitOpen(true)}>
                    <Flag size={15} /> Submit Test
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="card h-fit p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Questions</p>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => setCurrentIdx(idx)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold ${
                  idx === currentIdx
                    ? 'bg-primary-700 text-white'
                    : answers[q._id] !== null
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button className="btn-secondary mt-4 w-full" onClick={() => setConfirmSubmitOpen(true)}>
            Submit Test
          </button>
        </div>
      </div>

      <Modal isOpen={confirmSubmitOpen} onClose={() => setConfirmSubmitOpen(false)} title="Submit Test?" size="sm">
        <p className="text-sm text-slate-600">
          You've answered {answeredCount} of {questions.length} questions. Once submitted, you cannot change your answers.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={() => setConfirmSubmitOpen(false)}>
            Keep Reviewing
          </button>
          <button className="btn-primary" onClick={() => doSubmit(false)} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Now'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
