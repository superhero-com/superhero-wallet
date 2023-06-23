import { METHODS } from '@aeternity/aepp-sdk-13';
import { useSdk13 } from '../../composables';
import { IN_FRAME } from '../../lib/environment';

export default (store) => {
  if (IN_FRAME) {
    store.registerModule('sdk-frame-reset', {
      actions: {
        /**
         * If the app is running in a frame following method is replacing the `reset` method
         * from the `persistState.js` file.
         * TODO We should have one method that handles the reset in a way based on the environment.
         */
        async reset() {
          const { getSdk } = useSdk13({ store });
          const sdk13 = await getSdk();
          Object.values(sdk13._clients).forEach((aepp) => {
            if (aepp.info.status && aepp.info.status !== 'DISCONNECTED') {
              aepp.sendMessage(
                { method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0' },
                true,
              );
              aepp.disconnect();
            }
          });
        },
      },
    });
  }
};
