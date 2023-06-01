import createRequest from './request';
import { logger } from './utils';

import type { AxiosInstance } from 'axios';
import { ChatGPTConfig } from './types';

export default class ChatGPT {
  private language: string;
  private request: AxiosInstance;

  constructor(config: ChatGPTConfig) {
    const host = config.proxyHost || 'https://api.openai.com';
    this.request = createRequest(host, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      data: {
        model: config.model || 'gpt-3.5-turbo',
        temperature: +(config.temperature || 0) || 1,
        top_p: +(config.top_p || 0) || 1,
        presence_penalty: 1,
        stream: false,
        max_tokens: 1000,
      },
    });
    this.language = config.language || 'Chinese';
  }

  private generatePrompt = (patch: string) => {
    const answerLanguage = `Answer me in ${this.language},`;

    return `Bellow is the gitlab code patch, please help me do a brief code review,${answerLanguage} if any bug risk and improvement suggestion are welcome
    ${patch}
    `;
  };

  private sendMessage = async (msg: string) => {
    const currentDate = new Date().toISOString().split('T')[0];
    return this.request.post('/v1/chat/completions', {
      messages: [
        {
          role: 'system',
          content:
            'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\n' +
            'Knowledge cutoff: 2021-09-01\n' +
            `Current date: ${currentDate}`,
        },
        { role: 'user', content: msg, name: undefined },
      ],
    });
  };

  public codeReview = async (patch: string) => {
    if (!patch) {
      logger.error('patch is empty');
      return '';
    }

    console.time('code-review cost');
    const prompt = this.generatePrompt(patch);

    const res = await this.sendMessage(prompt);

    console.timeEnd('code-review cost');
    console.log(res.data);
    const { choices } = res.data;

    if (Array.isArray(choices) && choices.length > 0) {
      return choices[0]?.message?.content;
    }
    return '';
  };
}
