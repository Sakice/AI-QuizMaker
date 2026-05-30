import { z } from 'zod';

const questionTypes = ['multiple_choice', 'true_false', 'short_answer'];

const numberFromForm = (fallback, schema) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    return Number(value);
  }, schema);

export const quizRequestSchema = z.object({
  generationMode: z.enum(['ai', 'local']).default('local'),
  grade: z.string().trim().min(1).default('College / adult learner'),
  questionCount: numberFromForm(10, z.number().int().min(3).max(30)),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  language: z.string().trim().min(1).default('English'),
  timerMinutes: numberFromForm(20, z.number().int().min(0).max(180)),
  types: z
    .array(z.enum(questionTypes))
    .default(['multiple_choice', 'true_false'])
    .transform((types) => Array.from(new Set(types))),
  notes: z.string().default('')
});
