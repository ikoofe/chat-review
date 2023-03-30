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

const calLastNewLine = (diff: string) => {
  const list = diff.match(/@@ \-\d+,\d+ \+\d+,\d+ @@/g) || [];
  const len = list.length;
  if (len > 0) {
    const last = list[len - 1];
    const lineIndex = last.replace(/@@ \-\d+,\d+ \+(\d+),(\d+) @@/g, ($0, $1, $2) => {
      return `(${+$1}) + (${+$2})`;
    });

    return +lineIndex - 1;
  }

  return -1;
};

export default class Gitlab {
  private projectId: string | number;
  private mrIId: number | string;
  private request: AxiosInstance;

  constructor({ host, token, projectId, mrIId }: GitlabConfig) {
    this.request = createRequest({ host, token });
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
          .map((item: GitlabChange) => ({ ...item, lastNewLine: calLastNewLine(item.diff) }));
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
    body,
    ref,
  }: {
    newPath: string;
    newLine: number;
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
        },
      })
      .catch((error) => {
        logger.error(error);
      });
  }
}
