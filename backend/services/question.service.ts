import { redis } from './redis.service';
import { generateQuestion } from '../utils/question-generator';
import type { Difficulty } from '../utils/question-generator';

const CURRENT_QUESTION_KEY = 'current:question';

export type { Difficulty };

export interface CurrentQuestionResponse {
  id: string;
  problem: string;
  difficulty: string;
  createdAt: string;
}

export async function generateAndSetCurrentQuestion(
  difficulty: Difficulty = 'easy'
): Promise<CurrentQuestionResponse> {
  const question = generateQuestion(difficulty);
  const now = Date.now().toString();

  await redis.hset(CURRENT_QUESTION_KEY, {
    id: question.id,
    problem: question.problem,
    answer: String(question.answer),
    difficulty: question.difficulty,
    createdAt: now,
  });

  return {
    id: question.id,
    problem: question.problem,
    difficulty: question.difficulty,
    createdAt: now,
  };
}

export async function getCurrentQuestion(): Promise<CurrentQuestionResponse | null> {
  const data = await redis.hgetall(CURRENT_QUESTION_KEY);
  if (!data || Object.keys(data).length === 0) return null;

  const { answer: _answer, ...rest } = data as Record<string, string>;
  return rest as unknown as CurrentQuestionResponse;
}
