import type { LeaderboardEntry } from '../hooks/useQuizState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function submitScore(entry: LeaderboardEntry): Promise<void> {
  try {
    await fetch(`${API_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // Network failure — silently ignore, localStorage fallback is in place
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
