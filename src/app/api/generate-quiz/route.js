import { ZodError } from 'zod';
import { quizRequestSchema } from '@/features/quiz-generation/server/schemas/quiz-request.schema';
import { extractTextFromUpload } from '@/features/quiz-generation/server/services/extract.service';
import { generateQuizWithAi } from '@/features/quiz-generation/server/services/openai-quiz.service';
import { fallbackQuizFromText } from '@/features/quiz-generation/server/services/quiz.service';
import { getOpenAiClient } from '@/lib/server/openai-client';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((file) => file && file.size > 0);
    const options = quizRequestSchema.parse({
      generationMode: optionalFormValue(formData, 'generationMode'),
      grade: optionalFormValue(formData, 'grade'),
      questionCount: optionalFormValue(formData, 'questionCount'),
      difficulty: optionalFormValue(formData, 'difficulty'),
      language: optionalFormValue(formData, 'language'),
      timerMinutes: optionalFormValue(formData, 'timerMinutes'),
      types: formData.getAll('types'),
      notes: optionalFormValue(formData, 'notes') || ''
    });

    const fileTexts = await Promise.all(files.map(extractTextFromUpload));
    const sourceText = [...fileTexts, options.notes].filter(Boolean).join('\n\n');

    if (sourceText.trim().length < 100) {
      return Response.json(
        {
          error: 'The source material is too short. Upload a PDF, Word, or TXT file, or paste more complete course content.'
        },
        { status: 400 }
      );
    }

    const clippedText = sourceText.slice(0, 45000);
    const useAi = options.generationMode === 'ai';
    const openai = getOpenAiClient();

    if (useAi && !openai) {
      return Response.json(
        {
          error: 'AI mode is selected, but OPENAI_API_KEY is not configured. Choose local mode or add an API key.'
        },
        { status: 400 }
      );
    }

    const quiz = useAi
      ? await generateQuizWithAi(openai, clippedText, options)
      : fallbackQuizFromText(clippedText, options);

    return Response.json({
      ...quiz,
      meta: {
        generationMode: useAi ? 'ai' : 'local',
        aiEnabled: useAi,
        generatedAt: new Date().toISOString(),
        sourceCharacters: sourceText.length
      }
    });
  } catch (error) {
    const message = error instanceof ZodError
      ? 'The request parameters are incomplete or invalid.'
      : error.message || 'Quiz generation failed.';

    return Response.json({ error: message }, { status: 500 });
  }
}

function optionalFormValue(formData, key) {
  return formData.has(key) ? formData.get(key) : undefined;
}
