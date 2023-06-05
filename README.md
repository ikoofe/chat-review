# @koofe/chat-review

## Install

```sh
npm i @koofe/chat-review
```

## Usage

### Node.js

```js
import review from '@koofe/chat-review';

review({
  gitlabConfig: {
    host: 'https://gitlab.mokahr.com/',
    mrIId: 2001,
    projectId: 200,
    token: 'glpat-xxxxxx',
  },
  chatgptConfig: {
    apiKey: 'sk-xxxxxxxxx',
  },
});
```

### Shell

```sh
chat-review --chatgpt sk-xxxxxxxxx --token 'glpat-xxxxxx' --project 200 --mr 2001
```

通过 ChatGPT 进行代码审核的 CLI 工具，主要包含以下几个命令选项：

- `--chatgpt`：ChatGPT 的 API Token。
- `--token`：GitLab 的访问 Token。
- `--project`：GitLab 项目 ID。
- `--mr`：GitLab Merge Request ID。
- `--model`：ChatGPT 的模型类型，默认为 `gpt-3.5-turbo`。
- `--language`：ChatGPT 的语言类型，默认为中文。
- `--host`：GitLab 的访问地址，默认为 `https://gitlab.com`。
- `--proxyHost`：ChatGPT API host, 默认是 `https://api.openai.com`。
- `--target`：GitLab Review 的文件，默认为 /\.(j|t)sx?$/

### CI

在 Gitlab CI/CD 中设置 CHATGPT_KEY、GITLAB_TOKEN 变量，`.gitlab-ci.yml` 如下：

```yml
stages:
  - merge-request

Code Review:
  stage: merge-request
  image: node:latest
  script:
    - npm i @koofe/chat-review -g
    - echo "$CI_MERGE_REQUEST_PROJECT_ID" 
    - echo "$CI_MERGE_REQUEST_IID"
    - chat-review run --chatgpt "$CHATGPT_KEY" --token "$GITLAB_TOKEN" --project "$CI_MERGE_REQUEST_PROJECT_ID" --mr "$CI_MERGE_REQUEST_IID"
  only:
    - merge_requests
  except:
    variables:
      - $CI_MERGE_REQUEST_TARGET_BRANCH_NAME !~ /^(main|release)$/
  when: manual
```
