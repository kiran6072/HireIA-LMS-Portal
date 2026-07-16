import api from './axios';
import type { Course, CourseModule, Lesson, Progress } from '@/types';

export const getCourses = (params?: { status?: string; category?: string; search?: string }) =>
  api.get<{ success: boolean; count: number; courses: Course[] }>('/courses', { params }).then((r) => r.data);

export const getCourse = (id: string) =>
  api
    .get<{ success: boolean; course: Course; progress: Progress | null }>(`/courses/${id}`)
    .then((r) => r.data);

export const createCourse = (payload: FormData) =>
  api
    .post<{ success: boolean; message: string; course: Course }>('/courses', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const updateCourse = (id: string, payload: FormData) =>
  api
    .patch<{ success: boolean; message: string; course: Course }>(`/courses/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const deleteCourse = (id: string) => api.delete(`/courses/${id}`).then((r) => r.data);

export const publishCourse = (id: string, status: 'draft' | 'published') =>
  api.patch(`/courses/${id}/publish`, { status }).then((r) => r.data);

export const enrollStudents = (id: string, studentIds: string[]) =>
  api.post(`/courses/${id}/enroll`, { studentIds }).then((r) => r.data);

export const unenrollStudent = (id: string, studentId: string) =>
  api.delete(`/courses/${id}/enroll/${studentId}`).then((r) => r.data);

export const createModule = (courseId: string, payload: { title: string; description?: string; order?: number }) =>
  api
    .post<{ success: boolean; module: CourseModule }>(`/courses/${courseId}/modules`, payload)
    .then((r) => r.data);

export const updateModule = (id: string, payload: Partial<CourseModule>) =>
  api.patch(`/modules/${id}`, payload).then((r) => r.data);

export const deleteModule = (id: string) => api.delete(`/modules/${id}`).then((r) => r.data);

export const createLesson = (moduleId: string, payload: FormData) =>
  api
    .post<{ success: boolean; lesson: Lesson }>(`/modules/${moduleId}/lessons`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const updateLesson = (id: string, payload: FormData | Record<string, unknown>) => {
  const isForm = payload instanceof FormData;
  return api
    .patch(`/lessons/${id}`, payload, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
    .then((r) => r.data);
};

export const deleteLesson = (id: string) => api.delete(`/lessons/${id}`).then((r) => r.data);

export const getLesson = (id: string) =>
  api.get<{ success: boolean; lesson: Lesson }>(`/lessons/${id}`).then((r) => r.data);

export const markLessonComplete = (id: string) =>
  api.post<{ success: boolean; progress: Progress }>(`/lessons/${id}/complete`).then((r) => r.data);
