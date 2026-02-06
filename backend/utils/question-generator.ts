export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedQuestion {
  id: string;
  problem: string;
  answer: number;
  difficulty: Difficulty;
}

function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateEasy(): Omit<GeneratedQuestion, 'id' | 'difficulty'> {
  const op = randomInt(0, 2);
  const range = [1, 20];

  if (op === 0) {
    const a = randomInt(range[0], range[1]);
    const b = randomInt(range[0], range[1]);
    return { problem: `${a} + ${b}`, answer: a + b };
  }
  if (op === 1) {
    const a = randomInt(range[0], range[1]);
    const b = randomInt(range[0], range[1]);
    const [bigger, smaller] = a >= b ? [a, b] : [b, a];
    return { problem: `${bigger} - ${smaller}`, answer: bigger - smaller };
  }
  const a = randomInt(range[0], range[1]);
  const b = randomInt(range[0], range[1]);
  return { problem: `${a} * ${b}`, answer: a * b };
}

function generateMedium(): Omit<GeneratedQuestion, 'id' | 'difficulty'> {
  const op = randomInt(0, 2);

  if (op === 0) {
    const a = randomInt(10, 25);
    const b = randomInt(10, 25);
    return { problem: `${a} * ${b}`, answer: a * b };
  }
  if (op === 1) {
    const quotient = randomInt(2, 12);
    const divisor = randomInt(2, 12);
    const dividend = quotient * divisor;
    return { problem: `${dividend} / ${divisor}`, answer: quotient };
  }
  const base = randomInt(2, 10);
  const exp = randomInt(2, 4);
  const answer = Math.pow(base, exp);
  return { problem: `${base}^${exp}`, answer };
}

function generateHard(): Omit<GeneratedQuestion, 'id' | 'difficulty'> {
  const variant = randomInt(0, 1);

  if (variant === 0) {
    const a = randomInt(2, 12);
    const b = randomInt(2, 12);
    const c = randomInt(1, 20);
    const inner = a * b;
    return {
      problem: `(${a} * ${b}) + ${c}`,
      answer: inner + c,
    };
  }
  const b = randomInt(2, 9);
  const c = randomInt(2, 9);
  const inner = b * c;
  const a = randomInt(inner + 1, inner + 50);
  return {
    problem: `${a} - (${b} * ${c})`,
    answer: a - inner,
  };
}

export function generateQuestion(difficulty: Difficulty = 'easy'): GeneratedQuestion {
  const id = generateId();
  let partial: Omit<GeneratedQuestion, 'id' | 'difficulty'>;

  switch (difficulty) {
    case 'easy':
      partial = generateEasy();
      break;
    case 'medium':
      partial = generateMedium();
      break;
    case 'hard':
      partial = generateHard();
      break;
  }

  return {
    id,
    problem: partial.problem,
    answer: partial.answer,
    difficulty,
  };
}
