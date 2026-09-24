import type { Evaluation } from '../api/types';
import { get, post } from './api';

export async function getEvaluations(): Promise<Evaluation[]> {
  return get<Evaluation[]>('/evaluations');
}

export async function getProjectEvaluations(projectId: string): Promise<Evaluation[]> {
  return get<Evaluation[]>(`/evaluations/project/${projectId}`);
}

export async function submitEvaluation(projectId: string, input: { studentId: string; score: number; comments?: string }): Promise<Evaluation> {
  return post<Evaluation>(`/evaluations/project/${projectId}`, input);
}
