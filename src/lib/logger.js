import Vue from 'vue';
import { detect } from 'detect-browser';
import { getState } from '../store/plugins/persistState';

export default class Logger {
  static init(options = {}) {
    const { background } = options;
    if (!background) {
      Vue.config.errorHandler = (e, vm, info) => {
        console.error(info);
        console.error(e);
        Logger.write({
          e,
          info,
          type: 'vue-error',
        });
      };

      Vue.config.warnHandler = (e, vm, info) => {
        console.error(e);
        console.error(info);
        Logger.write({
          msg: e,
          stacktrace: info,
          type: 'vue-warn',
        });
      };
    }

    window.addEventListener('unhandledrejection', promise => {
      const { stack, message } = promise.reason;
      Logger.write({
        msg: message,
        stacktrace: stack,
        type: 'unhandledrejection',
      });
    });

    window.onerror = (message, source, line, col, error) => {
      Logger.write({
        msg: message,
        stacktrace: `${source} ${line}:${col}`,
        type: 'window-error',
        info: error,
      });
    };
  }

  static async write(error) {
    const { saveErrorLog } = await getState();
    if (!saveErrorLog) return false;
    const errorLog = await Logger.get();
    const { e = {}, ...err } = error;
    const log = {
      error: {
        stacktrace: e.stack,
        msg: e.message,
        name: e.name,
        ...err,
      },
      appVersion: process.env.npm_package_version,
      browser: detect(),
      type: process.env.IS_EXTENSION ? 'extension' : process.env.PLATFORM,
      time: Date.now(),
    };
    browser.storage.local.set({ errorLog: [...errorLog, log] });
    return true;
  }

  static async get() {
    const { errorLog = [] } = await browser.storage.local.get('errorLog');
    return errorLog;
  }

  static async sendLog() {
    const errorLog = await Logger.get();
    if (errorLog) {
      // TODO: make call to backend here
    }
  }
}
