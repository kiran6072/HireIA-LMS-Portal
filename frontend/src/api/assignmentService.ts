import api from './axios';
import type { Assignment, Submission } from '@/types';

export const getAssignments = (courseId?: string) =>
  api
    .get<{ success: boolean; count: number; assignments: Assignment[] }>('/assignments', {
      params: courseId ? { course: courseId } : undefined,
    })
    .then((r) => r.data);

export const getAssignment = (id: string) =>
  api
    .get<{ success: boolean; assignment: Assignment; mySubmission: Submission | null; submissions: Submission[] | null }>(
      `/assignments/${id}`
    )
    .then((r) => r.data);

export const createAssignment = (payload: FormData) =>
  api
    .post<{ success: boolean; assignment: Assignment }>('/assignments', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const updateAssignment = (id: string, payload: FormData | Record<string, unknown>) => {
  const isForm = payload instanceof FormData;
  return api
    .patch(`/assignments/${id}`, payload, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
    .then((r) => r.data);
};

export const deleteAssignment = (id: string) => api.delete(`/assignments/${id}`).then((r) => r.data);

export const submitAssignment = (id: string, file: File) => {
  const fd = new FormData();
  fd.append('submissionFile', file);
  return api
    .post<{ success: boolean; message: string; submission: Submission }>(`/assignments/${id}/submit`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const gradeSubmission = (
  submissionId: string,
  payload: { grade?: number; feedback?: string; requestResubmit?: boolean }
) => api.patch(`/assignments/submissions/${submissionId}/grade`, payload).then((r) => r.data);
