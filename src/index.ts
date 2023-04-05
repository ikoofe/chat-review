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
    const message = await chatgpt.codeReview(change.diff);
    const result = await gitlab.codeReview({ message, ref, change });
    logger.info(message, result?.data);
  }
}

export default run;
