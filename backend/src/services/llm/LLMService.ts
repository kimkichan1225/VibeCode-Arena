import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

export interface LLMCompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMService {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
    this.model = config.agents.model;
  }

  async completion(options: LLMCompletionOptions): Promise<string> {
    const { systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000 } = options;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return '';
  }

  async *streamCompletion(
    options: LLMCompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    const { systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000 } = options;

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          yield delta.text;
        }
      }
    }
  }
}

export const llmService = new LLMService();
