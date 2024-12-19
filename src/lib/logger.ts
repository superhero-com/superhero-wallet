/* eslint-disable no-console */
import { pick } from 'lodash-es';
import { detect } from 'detect-browser';
import { App, ComputedRef } from 'vue';

import { IS_PRODUCTION, MAX_LOG_ENTRIES, STORAGE_KEYS } from '@/constants';
import { exportFile } from '@/utils';
import { tg as t } from '@/popup/plugins/i18n';
import { useModals, useUi } from '@/composables';

import { WalletStorage } from './WalletStorage';
import { RejectedByUserError } from './errors';

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
  title?: string;
  modal?: boolean;
  message: string;
  type: 'vue-error' | 'unhandledrejection' | 'window-error' | 'api-response';
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
        Logger.write({
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

  static write({ modal = !IS_PRODUCTION, ...error }: ILoggerInput) {
    if (!Logger.background && modal && error.message) {
      const { openErrorModal } = useModals();
      openErrorModal({
        title: error.title || t('modals.error-log.title'),
        msg: error.message,
      });
    }
    if (!Logger.saveErrorLog.value) {
      return;
    }
    const errorLog = Logger.get();
    const logEntry: ILoggerEntry = {
      error: { ...pick(error, ['name', ...Object.getOwnPropertyNames(error)]) },
      appVersion: process.env.npm_package_version,
      browser: detect(),
      platform: process.env.PLATFORM!,
      time: Date.now(),
    };
    WalletStorage.set(STORAGE_KEYS.errorLog, [...errorLog, logEntry].slice(-MAX_LOG_ENTRIES));
  }

  static get(): ILoggerEntry[] {
    return WalletStorage.get(STORAGE_KEYS.errorLog) || [];
  }

  static sendLog() {
    const errorLog = Logger.get();
    if (errorLog) {
      // TODO: make call to backend here
    }
  }

  static async exportErrorLog(clear: boolean = false) {
    const path = await exportFile(
      JSON.stringify(Logger.get()),
      'errorLogExport.json',
    );
    if (path) {
      const { openDefaultModal } = useModals();
      openDefaultModal({
        title: t('pages.addressBook.export.title'),
        msg: t('pages.addressBook.export.message') + path,
      });
    }
    if (clear) {
      WalletStorage.set(STORAGE_KEYS.errorLog, []);
    }
  }
}
