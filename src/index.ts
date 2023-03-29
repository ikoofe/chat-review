import 'isomorphic-fetch';
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
  logger.info(state, changes, ref);
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
      const { lastNewLine = -1, lastOldLine = -1, newPath, oldPath } = change;
      const params: { oldLine?: number; oldPath?: string} = {

      };
      if (lastNewLine <= 0) {
        logger.error('Code line error');
        return;
      }

      if (lastOldLine >= 0) {
        params.oldLine = lastOldLine;
        params.oldPath = oldPath;
      }

      await gitlab.postComment({
        ...params,
        newLine: lastNewLine,
        newPath: newPath,
        body,
        ref,
      });
    }
  }
}

export default run;

