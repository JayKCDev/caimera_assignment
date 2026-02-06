import type { Server, Socket } from 'socket.io';
import { redis } from '../services/redis.service';
import { getSession } from '../services/session.service';
import { submitAnswer } from '../services/submission.service';
import { getCurrentQuestion, generateAndSetCurrentQuestion } from '../services/question.service';
import { getLeaderboard } from '../services/leaderboard.service';

const USER_SOCKETS_KEY = 'user:sockets';

interface SubmitAnswerPayload {
  questionId: string;
  answer: number | string;
}

function getSessionId(socket: Socket): string | undefined {
  return socket.data.sessionId as string | undefined;
}

function broadcastUserCount(io: Server): void {
  const count = io.sockets.sockets.size;
  io.emit('users:count', { count });
}

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', async (socket) => {
    const sessionId = socket.handshake.auth?.sessionId;
    if (!sessionId) {
      socket.emit('error', { message: 'Session required' });
      socket.disconnect(true);
      return;
    }

    const session = await getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Invalid session' });
      socket.disconnect(true);
      return;
    }

    socket.data.sessionId = sessionId;
    await redis.hset(USER_SOCKETS_KEY, sessionId, socket.id);

    const sendQuestionAndLeaderboard = async () => {
      let question = await getCurrentQuestion();
      if (!question) {
        question = await generateAndSetCurrentQuestion();
        io.emit('question:new', question);
      }
      socket.emit('question:current', question);
      const leaderboard = await getLeaderboard(10);
      socket.emit('leaderboard:update', leaderboard);
      broadcastUserCount(io);
    };

    await sendQuestionAndLeaderboard();

    socket.on('join', sendQuestionAndLeaderboard);

    socket.on('submit_answer', async (payload: SubmitAnswerPayload) => {
      const sid = getSessionId(socket);
      if (!sid) return;

      const { questionId, answer } = payload ?? {};
      if (!questionId || answer === undefined) {
        socket.emit('error', { message: 'Invalid payload' });
        return;
      }

      const result = await submitAnswer(sid, questionId, answer);
      socket.emit('answer:result', result);

      if (result.success && result.isWinner && result.needsNewQuestion) {
        const newQuestion = await generateAndSetCurrentQuestion();
        const winnerSession = await getSession(sid);

        io.emit('winner:announced', {
          username: winnerSession?.username ?? 'Unknown',
          sessionId: sid,
          newScore: result.newScore,
        });
        io.emit('question:new', newQuestion);

        const leaderboard = await getLeaderboard(10);
        io.emit('leaderboard:update', leaderboard);
      }
    });

    socket.on('get_leaderboard', async () => {
      const leaderboard = await getLeaderboard(10);
      socket.emit('leaderboard:update', leaderboard);
    });

    socket.on('ping', (timestamp: number) => {
      socket.emit('pong', timestamp);
    });

    socket.on('disconnect', async () => {
      const sid = getSessionId(socket);
      if (sid) {
        await redis.hdel(USER_SOCKETS_KEY, sid);
      }
      broadcastUserCount(io);
    });
  });
};
