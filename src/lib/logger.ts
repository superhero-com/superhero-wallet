/* eslint-disable no-console */
import Vue from 'vue';
import { pick } from 'lodash-es';
import { Browser } from 'webextension-polyfill';
import { detect } from 'detect-browser';
import { getState } from '../store/plugins/persistState';
import { useModals } from '../composables';
import { RejectedByUserError } from './errors';

interface ILoggerOptions {
  background?: boolean;
}

export default class Logger {
  static background: boolean;

  static init(options: ILoggerOptions = {}) {
    const { background = false } = options;

    Logger.background = background;

    if (!background) {
      Vue.config.errorHandler = (error, vm, info) => {
        console.error(info);
        console.error(error);
        if (error && error instanceof RejectedByUserError) {
          Logger.write({ message: error.toString(), info, type: 'vue-error' });
        }
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
      const reason = promise.reason || {};
      const { stack, message, name } = reason;
      if (
        (
          typeof reason === 'string'
          && reason.includes('CompileError: WebAssembly.instantiate()')
        )
        || name === 'NavigationDuplicated'
        || (reason && reason instanceof RejectedByUserError)
      ) {
        return;
      }

      try {
        await Logger.write({
          message: typeof reason === 'string' ? reason : message,
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

  static async write({ modal = process.env.NODE_ENV !== 'production', ...error }) {
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
    (browser as Browser).storage.local.set({ errorLog: [...errorLog, logEntry] });
    if (!Logger.background && modal && error.message) {
      const { openErrorModal } = useModals();
      openErrorModal(logEntry);
    }
  }

  static async get() {
    const { errorLog = [] } = await (browser as Browser).storage.local.get('errorLog');
    return errorLog;
  }

  static async sendLog() {
    const errorLog = await Logger.get();
    if (errorLog) {
      // TODO: make call to backend here
    }
  }
}
