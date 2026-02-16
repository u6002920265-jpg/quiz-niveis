import { kv } from '@vercel/kv';

const SCORES_KEY = 'leaderboard:scores';
const ENTRY_PREFIX = 'leaderboard:entry:';
const MAX_ENTRIES = 50;

// Composite score: higher score first, then earlier date first
// score * 1e13 + (1e13 - timestamp)
function compositeScore(score, dateStr) {
  const ts = new Date(dateStr).getTime();
  return score * 1e13 + (1e13 - ts);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get top entries from sorted set (highest composite score first)
      const ids = await kv.zrange(SCORES_KEY, 0, MAX_ENTRIES - 1, { rev: true });

      if (!ids || ids.length === 0) {
        return res.json([]);
      }

      // Fetch all entry data via pipeline
      const pipeline = kv.pipeline();
      for (const id of ids) {
        pipeline.hgetall(`${ENTRY_PREFIX}${id}`);
      }
      const results = await pipeline.exec();

      const entries = results
        .filter((entry) => entry !== null)
        .map((entry) => ({
          name: entry.name,
          score: Number(entry.score),
          correct: Number(entry.correct),
          total: Number(entry.total),
          date: entry.date,
        }));

      return res.json(entries);
    }

    if (req.method === 'POST') {
      const { name, score, correct, total, date, submissionId } = req.body;

      // Validation
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

      // Duplicate check using submissionId
      const id = submissionId || `${name.trim()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (submissionId) {
        const exists = await kv.exists(`${ENTRY_PREFIX}${id}`);
        if (exists) {
          return res.status(200).json({ duplicate: true });
        }
      }

      const entry = { name: name.trim(), score, correct, total, date };
      const zScore = compositeScore(score, date);

      // Atomic write: store entry data + add to sorted set
      const pipeline = kv.pipeline();
      pipeline.hset(`${ENTRY_PREFIX}${id}`, entry);
      pipeline.zadd(SCORES_KEY, { score: zScore, member: id });
      await pipeline.exec();

      // Trim: remove lowest entries if over capacity
      const count = await kv.zcard(SCORES_KEY);
      if (count > MAX_ENTRIES) {
        const toRemove = await kv.zrange(SCORES_KEY, 0, count - MAX_ENTRIES - 1);
        if (toRemove && toRemove.length > 0) {
          const trimPipeline = kv.pipeline();
          trimPipeline.zrem(SCORES_KEY, ...toRemove);
          for (const removeId of toRemove) {
            trimPipeline.del(`${ENTRY_PREFIX}${removeId}`);
          }
          await trimPipeline.exec();
        }
      }

      return res.status(201).json(entry);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
