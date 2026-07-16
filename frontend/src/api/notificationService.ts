import api from './axios';
import type { Notification } from '@/types';

export const getMyNotifications = () =>
  api
    .get<{ success: boolean; unreadCount: number; notifications: Notification[] }>('/notifications')
    .then((r) => r.data);

export const markAsRead = (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllAsRead = () => api.patch('/notifications/read-all').then((r) => r.data);

export const deleteNotification = (id: string) => api.delete(`/notifications/${id}`).then((r) => r.data);

export const broadcastNotification = (payload: {
  title: string;
  message: string;
  type?: string;
  link?: string;
  studentIds?: string[];
}) => api.post('/notifications/broadcast', payload).then((r) => r.data);
