import type { LeaderboardEntry } from '../hooks/useQuizState';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface SubmitResult {
  success: boolean;
  duplicate?: boolean;
  error?: string;
}

export async function submitScore(entry: LeaderboardEntry, submissionId?: string): Promise<SubmitResult> {
  try {
    const res = await fetch(`${API_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, submissionId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data.duplicate) {
      return { success: true, duplicate: true };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[] | null> {
  try {
    const res = await fetch(`${API_URL}/api/leaderboard`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
