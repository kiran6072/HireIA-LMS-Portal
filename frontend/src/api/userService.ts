import api from './axios';
import type { User, Course, Progress } from '@/types';

export const getStudents = (params?: { search?: string; batch?: string; status?: string }) =>
  api.get<{ success: boolean; count: number; students: User[] }>('/users/students', { params }).then((r) => r.data);

export const getStudent = (id: string) =>
  api
    .get<{ success: boolean; student: User; courses: Course[]; progress: Progress[] }>(`/users/students/${id}`)
    .then((r) => r.data);

export const updateStudent = (id: string, payload: Partial<User>) =>
  api.patch(`/users/students/${id}`, payload).then((r) => r.data);

export const deleteStudent = (id: string) => api.delete(`/users/students/${id}`).then((r) => r.data);

export const toggleStudentActive = (id: string) => api.patch(`/users/students/${id}/toggle-active`).then((r) => r.data);
