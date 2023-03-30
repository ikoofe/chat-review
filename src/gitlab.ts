import camelCase from 'camelcase';
import createRequest from './request';
import { logger } from './utils';

import type { GitlabConfig, GitlabDiffRef, GitlabChange } from './types';
import type { AxiosInstance } from 'axios';

const formatByCamelCase = (obj: Record<string, any>) => {
  const target = Object.keys(obj).reduce((result, key) => {
    const newkey = camelCase(key);
    return { ...result, [newkey]: obj[key] };
  }, {});

  return target;
};

const calLastLine = (diff: string) => {
  const diffList = diff.split('\n').reverse();
  const lastLineFirstChar = diffList[1][0];
  const lastDiff =
    diffList.find((item) => {
      return /^@@ \-\d+,\d+ \+\d+,\d+ @@/g.test(item);
    }) || '';

  const [lastOldLineCount, lastNewLineCount] = lastDiff
    .replace(/@@ \-(\d+),(\d+) \+(\d+),(\d+) @@/g, ($0, $1, $2, $3, $4) => {
      return `${+$1 + +$2},${+$3 + +$4}`;
    })
    .split(',');

  let lastOldLine = parseInt(lastOldLineCount);
  let lastNewLine = parseInt(lastNewLineCount);

  lastOldLine = isNaN(lastOldLine) ? -1 : lastOldLine - 1;
  lastNewLine = isNaN(lastNewLine) ? -1 : lastNewLine - 1;

  lastOldLine = lastLineFirstChar === '+' ? -1 : lastOldLine;
  lastNewLine = lastLineFirstChar === '-' ? -1 : lastNewLine;

  return {
    lastOldLine,
    lastNewLine,
  };
};

export default class Gitlab {
  private projectId: string | number;
  private mrIId: number | string;
  private request: AxiosInstance;

  constructor({ host, token, projectId, mrIId }: GitlabConfig) {
    this.request = createRequest(host, { params: { private_token: token } });
    this.mrIId = mrIId;
    this.projectId = projectId;
  }

  getChanges() {
    /** https://docs.gitlab.com/ee/api/merge_requests.html#get-single-merge-request-changes */
    return this.request
      .get(`/api/v4/projects/${this.projectId}/merge_requests/${this.mrIId}/changes`)
      .then((res) => {
        const { changes, diff_refs: diffRef, state } = res.data;
        const codeChanges: GitlabChange[] = changes
          .map((item: Record<string, any>) => formatByCamelCase(item))
          .filter((item: GitlabChange) => {
            const { newPath, renamedFile, deletedFile } = item;
            if (renamedFile || deletedFile) {
              return false;
            }
            if (!/\.(j|t)sx?$/.test(newPath)) {
              return false;
            }
            return true;
          })
          .map((item: GitlabChange) => {
            const { lastOldLine, lastNewLine } = calLastLine(item.diff);
            return { ...item, lastNewLine, lastOldLine };
          });
        return {
          state,
          changes: codeChanges,
          ref: formatByCamelCase(diffRef) as GitlabDiffRef,
        };
      })
      .catch((error) => {
        logger.error(error);
        return {
          state: '',
          changes: [],
          ref: {} as GitlabDiffRef,
        };
      });
  }

  postComment({
    newPath,
    newLine,
    oldPath,
    oldLine,
    body,
    ref,
  }: {
    newPath?: string;
    newLine?: number;
    oldPath?: string;
    oldLine?: number;
    body: string;
    ref: GitlabDiffRef;
  }) {
    /** https://docs.gitlab.com/ee/api/discussions.html#create-a-new-thread-in-the-merge-request-diff */
    return this.request
      .post(`/api/v4/projects/${this.projectId}/merge_requests/${this.mrIId}/discussions`, {
        body,
        position: {
          position_type: 'text',
          base_sha: ref?.baseSha,
          head_sha: ref?.headSha,
          start_sha: ref?.startSha,
          new_path: newPath,
          new_line: newLine,
          old_path: oldPath,
          old_line: oldLine,
        },
      })
      .catch((error) => {
        logger.error(error);
      });
  }

  async codeReview({
    change,
    message,
    ref,
  }: {
    change: GitlabChange;
    message: string;
    ref: GitlabDiffRef;
  }) {
    const { lastNewLine = -1, lastOldLine = -1, newPath, oldPath } = change;

    if (lastNewLine === -1 && lastOldLine === -1) {
      logger.error('Code line error');
      return;
    }

    const params: { oldLine?: number; oldPath?: string; newLine?: number; newPath?: string } = {};

    if (lastOldLine !== -1) {
      params.oldLine = lastOldLine;
      params.oldPath = oldPath;
    }

    if (lastNewLine !== -1) {
      params.newLine = lastNewLine;
      params.newPath = newPath;
    }

    return await this.postComment({
      ...params,
      body: message,
      ref,
    });
  }
}
