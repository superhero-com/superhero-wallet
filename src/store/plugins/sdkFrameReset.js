import { useSdk } from '../../composables';
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
          const { getSdk } = useSdk({ store });
          const sdk = await getSdk();
          Object.values(sdk.rpcClients).forEach((aepp) => {
            if (aepp.info.status && aepp.info.status !== 'DISCONNECTED') {
              aepp.sendMessage(
                { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
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
