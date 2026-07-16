import api from './axios';
import type { Certificate, User } from '@/types';

export const getCertificates = (courseId?: string) =>
  api
    .get<{ success: boolean; count: number; certificates: Certificate[] }>('/certificates', {
      params: courseId ? { course: courseId } : undefined,
    })
    .then((r) => r.data);

export const generateCertificate = (studentId: string, courseId: string, grade?: string) =>
  api
    .post<{ success: boolean; message: string; certificate: Certificate }>('/certificates/generate', {
      studentId,
      courseId,
      grade,
    })
    .then((r) => r.data);

export const getEligibleStudents = (courseId: string) =>
  api.get<{ success: boolean; count: number; students: User[] }>(`/certificates/eligible/${courseId}`).then((r) => r.data);

export const revokeCertificate = (id: string) => api.delete(`/certificates/${id}`).then((r) => r.data);

export const verifyCertificate = (certificateId: string) =>
  api
    .get<{
      success: boolean;
      valid: boolean;
      message?: string;
      certificate?: {
        certificateId: string;
        studentName: string;
        courseTitle: string;
        issueDate: string;
        grade?: string;
        pdfUrl: string;
      };
    }>(`/certificates/verify/${certificateId}`)
    .then((r) => r.data);
