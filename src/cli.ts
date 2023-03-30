#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { cac } from 'cac';

import run from './index';

import { logger } from './utils';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)).toString()
);

const cli = cac('chat-review');

const cwd = process.cwd();

// publish
cli
  .command('run', 'code review by chatgpt')
  .option('-c, --chatgpt <chatgpt>', 'chatgpt api token')
  .option('-m, --model <model>', 'chatgpt model', {
    default: 'gpt-3.5-turbo',
  })
  .option('-l, --language <language>', 'chatgpt language', {
    default: 'Chinese',
  })
  .option('-h, --host <host>', 'gitlab host')
  .option('-t, --token <token>', 'gitlab token')
  .option('-p, --project <project>', 'gitlab project id')
  .option('-M, --mr <mr>', 'gitlab merge request id')
  .action(
    async (
      root = cwd,
      options: {
        chatgpt: string;
        model: string;
        language: string;
        host: string;
        token: string;
        project: string | number;
        mr: string | number;
      }
    ) => {
      const {
        host,
        token,
        project: projectId,
        mr: mrIId,
        chatgpt: apiKey,
        language,
        model,
      } = options;
      try {
        run({
          gitlabConfig: {
            host,
            token,
            projectId,
            mrIId,
          },
          chatgptConfig: {
            apiKey,
            language,
            model,
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
