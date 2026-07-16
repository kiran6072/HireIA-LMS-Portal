import api from './axios';
import type { Test, TestAttemptResult, TestReviewItem } from '@/types';

export const getTests = (courseId?: string) =>
  api
    .get<{ success: boolean; count: number; tests: Test[] }>('/tests', {
      params: courseId ? { course: courseId } : undefined,
    })
    .then((r) => r.data);

export const getTest = (id: string) =>
  api.get<{ success: boolean; test: Test; attempts?: unknown[] }>(`/tests/${id}`).then((r) => r.data);

export const createTest = (payload: Record<string, unknown>) =>
  api.post<{ success: boolean; test: Test }>('/tests', payload).then((r) => r.data);

export const updateTest = (id: string, payload: Record<string, unknown>) =>
  api.patch(`/tests/${id}`, payload).then((r) => r.data);

export const deleteTest = (id: string) => api.delete(`/tests/${id}`).then((r) => r.data);

export const getTestResults = (id: string) =>
  api.get<{ success: boolean; count: number; attempts: any[] }>(`/tests/${id}/results`).then((r) => r.data);

export interface StartAttemptResponse {
  success: boolean;
  resumed: boolean;
  attemptId: string;
  remainingSeconds: number;
  questions: { _id: string; questionText: string; options: { _id: string; text: string }[]; marks: number }[];
}

export const startAttempt = (testId: string) =>
  api.post<StartAttemptResponse>(`/tests/${testId}/start`).then((r) => r.data);

export interface SubmitAttemptResponse {
  success: boolean;
  message: string;
  result: TestAttemptResult;
  review: TestReviewItem[];
}

export const submitAttempt = (
  attemptId: string,
  answers: { questionId: string; selectedOptionIndex: number | null }[],
  autoSubmitted = false
) =>
  api
    .post<SubmitAttemptResponse>(`/tests/attempts/${attemptId}/submit`, { answers, autoSubmitted })
    .then((r) => r.data);
