import { put, list, head } from '@vercel/blob';

const BLOB_PATH = 'leaderboard.json';
const MAX_ENTRIES = 50;

async function readLeaderboard() {
  try {
    // List blobs to find the leaderboard file
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (blobs.length === 0) return [];

    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch {
    return [];
  }
}

async function writeLeaderboard(entries) {
  await put(BLOB_PATH, JSON.stringify(entries, null, 2), {
    access: 'public',
    addRandomSuffix: false,
  });
}

function sortEntries(entries) {
  return entries
    .sort((a, b) => b.score - a.score || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_ENTRIES);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const entries = await readLeaderboard();
    return res.json(sortEntries(entries));
  }

  if (req.method === 'POST') {
    const { name, score, correct, total, date } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (name.length > 30) {
      return res.status(400).json({ error: 'name must be 30 characters or less' });
    }
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ error: 'score must be a number between 0 and 100' });
    }
    if (typeof correct !== 'number' || correct < 0) {
      return res.status(400).json({ error: 'correct must be a non-negative number' });
    }
    if (typeof total !== 'number' || total < 1) {
      return res.status(400).json({ error: 'total must be a positive number' });
    }
    if (typeof date !== 'string' || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'date must be a valid ISO date string' });
    }

    const entry = { name: name.trim(), score, correct, total, date };
    const entries = await readLeaderboard();
    entries.push(entry);
    const sorted = sortEntries(entries);
    await writeLeaderboard(sorted);

    return res.status(201).json(entry);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
