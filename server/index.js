const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const BASE_PORT = Number(process.env.PORT) || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');
const MAX_ENTRIES = 50;

app.use(cors());
app.use(express.json());

function readLeaderboard() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeLeaderboard(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}

// GET /api/leaderboard — return top 50 sorted by score DESC, date ASC
app.get('/api/leaderboard', (_req, res) => {
  const entries = readLeaderboard();
  const sorted = entries
    .sort((a, b) => b.score - a.score || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_ENTRIES);
  res.json(sorted);
});

// POST /api/leaderboard — submit a new entry
app.post('/api/leaderboard', (req, res) => {
  const { name, score, correct, total, date } = req.body;

  // Validate required fields
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

  const entry = {
    name: name.trim(),
    score,
    correct,
    total,
    date,
  };

  const entries = readLeaderboard();
  entries.push(entry);

  // Keep only top 50
  const sorted = entries
    .sort((a, b) => b.score - a.score || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_ENTRIES);

  writeLeaderboard(sorted);
  res.status(201).json(entry);
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Leaderboard server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort), 150);
      return;
    }

    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

startServer(BASE_PORT);
