#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { cac } from 'cac';

import run from './index';

import { logger } from './utils';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)).toString()
);

const cli = cac('chat-review');

cli
  .command('run', 'code review by chatgpt')
  .option('--chatgpt <chatgpt>', 'chatgpt api token')
  .option('--token <token>', 'gitlab token')
  .option('--project <project>', 'gitlab project id')
  .option('--mr <mr>', 'gitlab merge request id')
  .option('--model <model>', 'chatgpt model', {
    default: 'gpt-3.5-turbo',
  })
  .option('--language <language>', 'chatgpt language', {
    default: 'Chinese',
  })
  .option('--host <host>', 'gitlab host', {
    default: 'https://gitlab.com',
  })
  .option('--proxyHost <host>', 'custom chatgpt api host', {
    default: 'https://api.openai.com',
  })
  .option('--target [target]', 'review files', {
    default: /\.(j|t)sx?$/,
  })
  .action(
    async (options: {
      chatgpt: string;
      model: string;
      language: string;
      host: string;
      proxyHost: string;
      token: string;
      project: string | number;
      mr: string | number;
      target: string
    }) => {
      const {
        host,
        proxyHost,
        token,
        project: projectId,
        mr: mrIId,
        chatgpt: apiKey,
        language,
        model,
        target,
      } = options;
      try {
        run({
          gitlabConfig: {
            host,
            token,
            projectId,
            mrIId,
            target: new RegExp(target),
          },
          chatgptConfig: {
            apiKey,
            language,
            model,
            proxyHost
          },
        });
      } catch (error) {
        logger.error(error);
      }
    }
  );

cli.help();
cli.version(version);
cli.parse();
