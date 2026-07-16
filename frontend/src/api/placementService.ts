import api from './axios';
import type { Placement, PlacementStatus } from '@/types';

export interface PlacementStats {
  totalStudents: number;
  studentsPlaced: number;
  placementRate: number;
  totalDrives: number;
  byStatus: Record<string, number>;
  avgSalaryLPA: number;
  highestSalaryLPA: number;
  topCompanies: { company: string; count: number }[];
}

export const getPlacements = (params?: { status?: string; company?: string }) =>
  api
    .get<{ success: boolean; count: number; placements: Placement[] }>('/placements', { params })
    .then((r) => r.data);

export const getPlacementStats = () =>
  api.get<{ success: boolean; stats: PlacementStats }>('/placements/stats').then((r) => r.data);

export const createPlacement = (payload: FormData) =>
  api
    .post<{ success: boolean; message: string; placement: Placement }>('/placements', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const updatePlacement = (id: string, payload: FormData | { status?: PlacementStatus; [k: string]: unknown }) => {
  const isForm = payload instanceof FormData;
  return api
    .patch(`/placements/${id}`, payload, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
    .then((r) => r.data);
};

export const deletePlacement = (id: string) => api.delete(`/placements/${id}`).then((r) => r.data);
