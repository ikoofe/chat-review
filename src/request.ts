import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const createRequest = (
  host: string,
  { headers, data, params }: { headers?: Record<string, string>; data?: Record<string, any>, params?:  Record<string, any> }
) => {
  const instance = axios.create({
    baseURL: host,
    timeout: 5000,
  });

  instance.interceptors.request.use(
    function (config: InternalAxiosRequestConfig) {
      // Do something before request is sent
      if (params) {
        config.params = { ...params, ...config.params };
      }
      if (headers) {
        config.headers.set(headers);
      }

      if (data) {
        config.data = { ...data, ...config.data };
      }
      return config;
    },
    function (error: AxiosError) {
      // Do something with request error
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    function (response: AxiosResponse) {
      return response;
    },
    function (error: AxiosError) {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      console.log(error);
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createRequest;
