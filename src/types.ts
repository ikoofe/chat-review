export type  GitlabConfig = {
  host: string;
  token: string;
  projectId: string | number;
  mrIId: string | number;
  target?: RegExp;
}

export type ChatGPTConfig = {
  apiKey: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  language?: string;
  proxyHost?: string
}
export interface GitlabDiffRef {
  baseSha: string;
  headSha: string;
  startSha: string;
}

export interface GitlabChange {
  newPath: string;
  oldPath: string;
  newFile: boolean;
  renamedFile: boolean;
  deletedFile: boolean;
  diff: string;
  lastNewLine?: number;
  lastOldLine?: number;
}
