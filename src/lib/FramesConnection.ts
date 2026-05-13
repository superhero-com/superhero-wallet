import { BrowserWindowMessageConnection } from '@aeternity/aepp-sdk';
import { executeAndSetInterval, handleUnknownError } from '@/utils';
import { AeSdkSuperhero } from '@/protocols/aeternity/libs/AeSdkSuperhero';

const POLLING_INTERVAL = 3000;

/**
 * Abstraction layer that allows to communicate between the wallet app running in an IFrame
 * and the parent dapps.
 */
export const FramesConnection = (() => {
  let initialized = false;
  let baseIntervalId: NodeJS.Timeout;
  let clientIntervalId: NodeJS.Timeout;
  let clientId: string | null = null;
  let connectedParent: Window | null = null;

  function getParentFrame(): Window | null {
    return window.parent === window ? null : window.parent;
  }

  function getParentOrigin(): string | undefined {
    const ancestorOrigins = (window.location as Location & { ancestorOrigins?: DOMStringList })
      .ancestorOrigins;
    if (ancestorOrigins?.length) {
      return ancestorOrigins[0];
    }

    if (!document.referrer) {
      return undefined;
    }
    try {
      return new URL(document.referrer).origin;
    } catch {
      return undefined;
    }
  }

  function removeClient(aeSdk: AeSdkSuperhero) {
    clearInterval(clientIntervalId);
    if (clientId) {
      aeSdk.removeRpcClient(clientId);
      clientId = null;
    }
    connectedParent = null;
  }

  function init(aeSdk: AeSdkSuperhero) {
    initialized = true;
    clearInterval(baseIntervalId);
    removeClient(aeSdk);

    try {
      baseIntervalId = executeAndSetInterval(
        () => {
          const parentFrame = getParentFrame();

          if (!parentFrame) {
            removeClient(aeSdk);
            return;
          }
          if (connectedParent === parentFrame) {
            return;
          }

          removeClient(aeSdk);
          connectedParent = parentFrame;

          const connection = new BrowserWindowMessageConnection({
            target: parentFrame,
            origin: getParentOrigin(),
          });
          const originalConnect = connection.connect;

          connection.connect = function connect(onMessage: any) {
            originalConnect.call(this, (data: any, origin: any, source: any) => {
              if (source !== parentFrame) {
                return;
              }

              /**
               * If the parent origin wasn't available before the first wallet
               * announcement, pin the connection to the origin that answered it.
               */
              if (!this.origin) {
                this.origin = origin;
              }
              clearInterval(clientIntervalId);
              onMessage(data, origin, source);
            }, () => {});
          };

          clientId = aeSdk.addRpcClient(connection);

          clientIntervalId = executeAndSetInterval(() => {
            if (getParentFrame() !== parentFrame || !clientId) {
              removeClient(aeSdk);
              return;
            }
            aeSdk.shareWalletInfo(clientId);
          }, POLLING_INTERVAL);
        },
        POLLING_INTERVAL,
      );
    } catch (error: any) {
      handleUnknownError(error);
    }
  }

  return {
    get initialized() {
      return initialized;
    },
    init,
  };
})();
