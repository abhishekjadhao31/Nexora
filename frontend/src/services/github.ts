import type { GitHubStatus } from '../api/types';
import { get } from './api';

export type GitHubContributionSummary = {
  commits: number;
  pullRequests: number;
  mergedPullRequests: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  timeline: Array<{ id: string; time: string; title: string; detail: string }>;
};

export async function getGitHubStatus(): Promise<GitHubStatus> {
  return get<GitHubStatus>('/github/status');
}

export async function getGitHubContributions(): Promise<GitHubContributionSummary> {
  return get<GitHubContributionSummary>('/github/contributions');
}
