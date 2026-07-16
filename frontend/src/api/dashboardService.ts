import api from './axios';

export const getAdminDashboard = () => api.get('/admin/dashboard').then((r) => r.data);
export const getStudentDashboard = () => api.get('/student/dashboard').then((r) => r.data);
