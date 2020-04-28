import axios from 'axios';
import Logger from './logger';

const request = axios.create();

request.interceptors.response.use(
  response => response,
  error => {
    const err = {
      res: error.response.data,
      url: error.config.url,
      data: error.config.data,
    };
    Logger.write(err);
    throw error;
  },
);

export default request;
