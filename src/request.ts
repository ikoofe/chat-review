import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { GitlabConfig } from './types'


const createRequest = (requestConfig: Pick<GitlabConfig, 'host' | 'token' >) => {
  const { host, token } = requestConfig;
  const instance = axios.create({
    baseURL: host,
  });


  instance.interceptors.request.use(function (config: any) {
    // Do something before request is sent
    const params  = { private_token: token, ...config.params };

    return { ...config, params };
  }, function (error: AxiosError) {
    // Do something with request error
    return Promise.reject(error);
  });

  instance.interceptors.response.use(function (response: AxiosResponse) {
    const { headers = {} } = response;

    const pagination = {
      next: headers['x-next-page'],
      total: headers['x-total-pages'],
      prev: headers['x-prev-page'],
      current: headers['x-page'],
      size: headers['x-per-page'],
      all: headers['x-total'],
    }

    return { ...response, pagination };
  }, function (error: AxiosError) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    console.log(error)
    return Promise.reject(error);
  });

  return instance;
}

export default createRequest;