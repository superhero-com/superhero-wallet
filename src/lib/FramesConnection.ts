import { times } from 'lodash-es';
import { AeSdkWallet, BrowserWindowMessageConnection } from '@aeternity/aepp-sdk';
import { ISdk } from '../types';
import { executeAndSetInterval, handleUnknownError } from '../popup/utils';

const POLLING_INTERVAL = 3000;

/**
 * Abstraction layer that allows to communicate between the wallet app running in an IFrame
 * and the parent dapps.
 */
export const FramesConnection = (() => {
  const connectedFrames = new Set();
  let initialized = false;
  let baseIntervalId: NodeJS.Timer;

  function getArrayOfAvailableFrames(): Window[] {
    return [
      window.parent,
      ...times(window.parent.frames.length, (i) => window.parent.frames[i]),
    ];
  }

  function init(sdk: ISdk | AeSdkWallet) {
    initialized = true;
    clearInterval(baseIntervalId);

    try {
      baseIntervalId = executeAndSetInterval(
        () => getArrayOfAvailableFrames()
          .filter((frame) => frame !== window)
          .forEach((target) => {
            if (connectedFrames.has(target)) {
              return;
            }

            connectedFrames.add(target);
            const connection = new BrowserWindowMessageConnection({ target });
            const originalConnect = connection.connect;
            let intervalId: NodeJS.Timer;

            connection.connect = function connect(onMessage: any) {
              originalConnect.call(this, (data: any, origin: any, source: any) => {
                if (source !== target) {
                  return;
                }
                clearInterval(intervalId);
                onMessage(data, origin, source);
              }, () => {});
            };

            const clientId = sdk.addRpcClient(connection);

            intervalId = executeAndSetInterval(() => {
              if (!getArrayOfAvailableFrames().includes(target)) {
                clearInterval(intervalId);
                return;
              }
              sdk.shareWalletInfo(clientId);
            }, 3000);
          }),
        POLLING_INTERVAL,
      );
    } catch (error: any) {
      handleUnknownError(error);
    }
  }

  return {
    initialized,
    init,
  };
})();
