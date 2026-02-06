import { redis } from './redis.service';
import { getSession } from './session.service';
import { validateAnswer } from '../utils/validators';

const CURRENT_QUESTION_KEY = 'current:question';
const LEADERBOARD_KEY = 'leaderboard';
const WINNER_TTL = 300;
const ATTEMPT_TTL = 60;
const POINTS_PER_WIN = 10;

function attemptKey(questionId: string, sessionId: string): string {
  return `question:${questionId}:attempts:${sessionId}`;
}

function winnerKey(questionId: string): string {
  return `question:${questionId}:winner`;
}

interface CurrentQuestionHash {
  id?: string;
  problem?: string;
  answer?: string;
  difficulty?: string;
  createdAt?: string;
}

export type SubmitAnswerError =
  | 'SESSION_INVALID'
  | 'QUESTION_CHANGED'
  | 'WRONG_ANSWER'
  | 'TOO_LATE'
  | 'INVALID_ANSWER';

export interface SubmitAnswerSuccess {
  success: true;
  isWinner: true;
  newScore: number;
  needsNewQuestion: true;
}

export interface SubmitAnswerErrorResult {
  success: false;
  error: SubmitAnswerError;
  message?: string;
  httpStatus?: number;
  winnerId?: string;
}

export type SubmitAnswerResult = SubmitAnswerSuccess | SubmitAnswerErrorResult;

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: number | string
): Promise<SubmitAnswerResult> {
  const numAnswer = typeof answer === 'number' ? answer : parseFloat(String(answer));
  if (!validateAnswer(numAnswer)) {
    return {
      success: false,
      error: 'INVALID_ANSWER',
      message: 'Invalid data',
      httpStatus: 400,
    };
  }

  const session = await getSession(sessionId);
  if (!session) {
    return { success: false, error: 'SESSION_INVALID' };
  }

  const currentQuestion = (await redis.hgetall(CURRENT_QUESTION_KEY)) as CurrentQuestionHash;
  if (!currentQuestion?.id || currentQuestion.id !== questionId) {
    return { success: false, error: 'QUESTION_CHANGED' };
  }

  const correctAnswer = Number(currentQuestion.answer);
  if (Number(numAnswer) !== correctAnswer) {
    await redis.setex(attemptKey(questionId, sessionId), ATTEMPT_TTL, Date.now().toString());
    return {
      success: false,
      error: 'WRONG_ANSWER',
      message: 'Incorrect Answer',
      httpStatus: 200,
    };
  }

  const setResult = await redis.set(winnerKey(questionId), sessionId, 'EX', WINNER_TTL, 'NX');

  if (setResult !== 'OK') {
    const winnerId = await redis.get(winnerKey(questionId));
    await redis.setex(attemptKey(questionId, sessionId), ATTEMPT_TTL, Date.now().toString());
    return {
      success: false,
      error: 'TOO_LATE',
      winnerId: winnerId ?? undefined,
    };
  }

  await redis.setex(attemptKey(questionId, sessionId), ATTEMPT_TTL, Date.now().toString());
  await redis.zincrby(LEADERBOARD_KEY, POINTS_PER_WIN, sessionId);
  const newScoreStr = await redis.zscore(LEADERBOARD_KEY, sessionId);
  const newScore = newScoreStr !== null ? parseFloat(newScoreStr) : POINTS_PER_WIN;

  return {
    success: true,
    isWinner: true,
    newScore,
    needsNewQuestion: true,
  };
}
