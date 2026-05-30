import { env } from '@/const/config/env';
import { getOpenAiClient } from '@/lib/server/openai-client';

export async function GET() {
  return Response.json({
    ok: true,
    aiEnabled: Boolean(getOpenAiClient()),
    model: env.openaiModel
  });
}
