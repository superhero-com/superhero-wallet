/* eslint-disable no-console */
import { pick } from 'lodash-es';
import { detect } from 'detect-browser';
import { App, ComputedRef } from 'vue';
import { IS_PRODUCTION, STORAGE_KEYS } from '@/constants';
import { useModals, useUi } from '../composables';
import { RejectedByUserError } from './errors';
import { WalletStorage } from './WalletStorage';

interface ILoggerOptions {
  background?: boolean;
  app?: App;
}

interface ILoggerEntry {
  error: any;
  appVersion?: string;
  browser: any;
  platform: string;
  time: number;
}

interface ILoggerInput {
  modal?: boolean;
  message: string;
  type: 'vue-error' | 'unhandledrejection' | 'window-error';
  stack?: string;
  info?: string | Error;
}

export default class Logger {
  static background: boolean;

  static saveErrorLog: ComputedRef<boolean> = useUi().saveErrorLog;

  static init(options: ILoggerOptions = {}) {
    const { background = false, app } = options;

    Logger.background = background;

    if (!background && app) {
      app.config.errorHandler = (error, vm, info) => {
        console.error(error, info);
        if (error && error instanceof RejectedByUserError) {
          Logger.write({ message: error.toString(), info, type: 'vue-error' });
        }
      };

      app.config.warnHandler = (message, vm, info) => {
        console.warn(message, info);
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
        message: (typeof message === 'object') ? message.type : message,
        stack: `${source} ${line}:${col}`,
        type: 'window-error',
        info: error,
      });
    };
  }

  static async write({ modal = !IS_PRODUCTION, ...error }: ILoggerInput) {
    if (!Logger.saveErrorLog.value) {
      return;
    }
    const errorLog = await Logger.get();
    const logEntry: ILoggerEntry = {
      error: { ...pick(error, ['name', ...Object.getOwnPropertyNames(error)]) },
      appVersion: process.env.npm_package_version,
      browser: detect(),
      platform: process.env.PLATFORM!,
      time: Date.now(),
    };
    WalletStorage.set(STORAGE_KEYS.errorLog, [...errorLog, logEntry]);
    if (!Logger.background && modal && error.message) {
      const { openErrorModal } = useModals();
      openErrorModal(logEntry);
    }
  }

  static async get(): Promise<ILoggerEntry[]> {
    return (await WalletStorage.get(STORAGE_KEYS.errorLog)) || [];
  }

  static async sendLog() {
    const errorLog = await Logger.get();
    if (errorLog) {
      // TODO: make call to backend here
    }
  }
}
