import { pick } from 'lodash-es';
import Vue from 'vue';
import { detect } from 'detect-browser';
import { getState } from '../store/plugins/persistState';
import { EventBus } from '../popup/utils/eventBus';

export default class Logger {
  static background;

  static init(options = {}) {
    const { background } = options;
    Logger.background = background;
    if (!background) {
      Vue.config.errorHandler = (error, vm, info) => {
        console.error(info);
        console.error(error);
        if (error.message !== 'Rejected by user')
          Logger.write({ message: error.toString(), info, type: 'vue-error' });
      };

      Vue.config.warnHandler = (message, vm, info) => {
        console.error(message);
        console.error(info);
        Logger.write({
          message,
          stack: info,
          type: 'vue-warn',
        });
      };
    }

    window.addEventListener('unhandledrejection', async (promise) => {
      const { stack, message, name } = promise.reason || {};
      if (
        (typeof promise.reason === 'string' &&
          promise.reason.includes('CompileError: WebAssembly.instantiate()')) ||
        name === 'NavigationDuplicated' ||
        message === 'Rejected by user'
      )
        return;
      try {
        await Logger.write({
          message: typeof promise.reason === 'string' ? promise.reason : message,
          stack,
          type: 'unhandledrejection',
        });
      } catch (error) {
        console.error('Logger:', error);
      }
    });

    window.onerror = (message, source, line, col, error) => {
      Logger.write({
        message,
        stack: `${source} ${line}:${col}`,
        type: 'window-error',
        info: error,
      });
    };
  }

  static async write({ modal = true, ...error }) {
    const { saveErrorLog } = await getState();
    if (!saveErrorLog) return;
    const errorLog = await Logger.get();
    const logEntry = {
      error: { ...pick(error, ['name', ...Object.getOwnPropertyNames(error)]) },
      appVersion: process.env.npm_package_version,
      browser: detect(),
      platform: process.env.PLATFORM,
      time: Date.now(),
    };
    browser.storage.local.set({ errorLog: [...errorLog, logEntry] });
    if (!Logger.background && modal && error.message) {
      EventBus.$emit('error', logEntry);
    }
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
