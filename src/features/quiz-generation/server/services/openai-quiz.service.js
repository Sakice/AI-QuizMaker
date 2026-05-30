import { env } from '@/const/config/env';
import { normalizeQuiz } from './quiz.service';

export async function generateQuizWithAi(openai, sourceText, options) {
  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Create valid JSON only. Do not include Markdown fences or commentary.'
      },
      {
        role: 'user',
        content: buildPrompt(sourceText, options)
      }
    ]
  });

  const content = response.choices[0]?.message?.content || '{}';
  return normalizeQuiz(JSON.parse(content), options);
}

function buildPrompt(sourceText, options) {
  return `
Create a quiz from the source material.

Requirements:
- Language: ${options.language}
- Learner level: ${options.grade}
- Difficulty: ${options.difficulty}
- Number of questions: ${options.questionCount}
- Allowed question types: ${options.types.join(', ')}
- Use ids q1, q2, q3, and so on.
- For multiple_choice questions, include exactly four options with ids A, B, C, D and make answer equal to the correct option id.
- For true_false questions, make answer either "true" or "false".
- For short_answer questions, make answer a concise reference answer.

Return this JSON shape:
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice | true_false | short_answer",
      "prompt": "string",
      "options": [{ "id": "A", "text": "string" }],
      "answer": "string",
      "explanation": "string"
    }
  ]
}

Source material:
${sourceText}
`;
}
