import OpenAI from 'openai';
import { env } from '@/const/config/env';

let client;

export function getOpenAiClient() {
  if (!env.openaiApiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return client;
}
