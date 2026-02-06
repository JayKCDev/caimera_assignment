import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './socket/handlers';
import { generateAndSetCurrentQuestion, getCurrentQuestion } from './services/question.service';
import {
  createSession,
  getSession,
  deleteSession,
} from './services/session.service';
import { getLeaderboard } from './services/leaderboard.service';
import { redis } from './services/redis.service';

dotenv.config();

const CORS_ORIGIN = process.env.CORS_ORIGIN;
const CORS_METHODS: string[] = ['GET', 'POST', 'DELETE', 'OPTIONS'];
const CORS_ALLOWED_HEADERS = ['Content-Type', 'Accept'];
const CORS_CREDENTIALS = Boolean(CORS_ORIGIN);

const corsOptions = {
  origin: CORS_ORIGIN ?? false,
  methods: CORS_METHODS,
  allowedHeaders: CORS_ALLOWED_HEADERS,
  credentials: CORS_CREDENTIALS,
  optionsSuccessStatus: 204,
};

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN ?? false,
    methods: CORS_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    credentials: CORS_CREDENTIALS,
  },
});

app.use(cors(corsOptions));
app.use(express.json());

app.post('/api/session', async (req, res) => {
  const username = req.body?.username;
  if (typeof username !== 'string') {
    res.status(400).json({ error: 'Username required' });
    return;
  }
  const result = await createSession(username);
  if ('error' in result) {
    if (result.error === 'USERNAME_TAKEN') {
      console.log(`[API] Session create failed: username "${username}" already taken`);
      res.status(200).json({ error: 'USERNAME_TAKEN', message: 'Username already taken' });
    } else {
      const msg = result.error === 'INVALID_USERNAME' ? 'Invalid username' : result.error;
      res.status(400).json({ error: result.error, message: msg });
    }
    return;
  }
  res.json(result);
});

app.get('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = await getSession(sessionId);
  if (!session) {
    res.status(404).end();
    return;
  }
  res.json({
    username: session.username,
    score: parseInt(session.score, 10),
    createdAt: session.createdAt,
  });
});

app.delete('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const ok = await deleteSession(sessionId);
  if (!ok) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/question/current', async (_req, res) => {
  const question = await getCurrentQuestion();
  res.json(question);
});

app.get('/api/leaderboard', async (_req, res) => {
  const leaderboard = await getLeaderboard(10);
  res.json(leaderboard);
});

app.get('/api/health', (_req, res) => {
  const redisConnected = redis.status === 'ready';
  res.json({
    status: redisConnected ? 'ok' : 'degraded',
    redis: redisConnected ? 'connected' : redis.status,
    uptime: Math.floor(process.uptime()),
  });
});

registerSocketHandlers(io);

const PORT = process.env.PORT ?? 3000;

httpServer.listen(PORT, async () => {
  await generateAndSetCurrentQuestion();
  console.log(`Server listening on port ${PORT}`);
});

export { app, io, httpServer };
