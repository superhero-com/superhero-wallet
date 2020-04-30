import axios from 'axios';
import Logger from './logger';

const request = axios.create();

request.interceptors.response.use(
  response => response,
  error => {
    Logger.write(error);
    throw error;
  },
);

export default request;
