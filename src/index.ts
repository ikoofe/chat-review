import Gitlab from './gitlab';
import ChatGPT from './chatgpt';
import { logger } from './utils';

import type { GitlabConfig, ChatGPTConfig } from './types';

async function run({
  gitlabConfig,
  chatgptConfig,
}: {
  gitlabConfig: GitlabConfig;
  chatgptConfig: ChatGPTConfig;
}) {
  const gitlab = new Gitlab(gitlabConfig);
  const chatgpt = new ChatGPT(chatgptConfig);

  const { state, changes, ref } = await gitlab.getChanges();
  if (state !== 'opened') {
    logger.log('MR is closed');
    return;
  }

  if (!chatgpt) {
    logger.log('Chat is null');
    return;
  }

  for (let i = 0; i < changes.length; i += 1) {
    const change = changes[i];
    const body = await chatgpt.codeReview(change.diff);
    if (!!body) {
      await gitlab.postComment({
        newPath: change.newPath,
        newLine: change.lastNewLine || 0,
        body,
        ref,
      });
    }
  }
}

export default run;
