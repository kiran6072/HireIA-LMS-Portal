import api from './axios';
import type { User, Role } from '@/types';

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export const login = (email: string, password: string, role: Role) =>
  api.post<AuthResponse>('/auth/login', { email, password, role }).then((r) => r.data);

export const registerStudent = (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  course?: string;
  batch?: string;
}) => api.post<AuthResponse>('/auth/register', payload).then((r) => r.data);

export const logout = () => api.post('/auth/logout').then((r) => r.data);

export const getMe = () => api.get<{ success: boolean; user: User }>('/auth/me').then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (token: string, password: string) =>
  api.patch<AuthResponse>(`/auth/reset-password/${token}`, { password }).then((r) => r.data);

export const updatePassword = (currentPassword: string, newPassword: string) =>
  api.patch<AuthResponse>('/auth/update-password', { currentPassword, newPassword }).then((r) => r.data);

export const updateProfile = (payload: FormData) =>
  api
    .patch<{ success: boolean; message: string; user: User }>('/auth/update-me', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const adminCreateStudent = (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  course?: string;
  batch?: string;
}) => api.post('/auth/admin/create-student', payload).then((r) => r.data);
