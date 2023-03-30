import { ChatGPTAPI } from 'chatgpt';
import { ChatGPTConfig } from './types';
import { logger } from './utils';

export default class ChatGTP {
  private chatAPI: ChatGPTAPI;
  private language: string;

  constructor(config: ChatGPTConfig) {
    this.chatAPI = new ChatGPTAPI({
      apiKey: config.apiKey,
      completionParams: {
        model: config.model || 'gpt-3.5-turbo',
        temperature: +(config.temperature || 0) || 1,
        top_p: +(config.top_p || 0) || 1,
      },
    });

    this.language = config.language || 'Chinese';
  }

  private generatePrompt = (patch: string) => {
    const answerLanguage = `Answer me in ${this.language},`

    return `Bellow is the code patch, please help me do a brief code review,${answerLanguage} if any bug risk and improvement suggestion are welcome
    ${patch}
    `;
  };

  public codeReview = async (patch: string) => {
    if (!patch) {
      logger.error('patch is empty');
      return '';
    }

    console.time('code-review cost');
    const prompt = this.generatePrompt(patch);

    const res = await this.chatAPI.sendMessage(prompt);

    console.timeEnd('code-review cost');
    return res.text;
  };
}