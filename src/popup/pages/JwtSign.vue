<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Encoded, decode, signJwt } from '@aeternity/aepp-sdk';

import { AeAccountHdWallet } from '@/protocols/aeternity/libs/AeAccountHdWallet';
import { JWT_HEADER, MODAL_CONFIRM_UNSAFE_SIGN, PROTOCOLS } from '@/constants';
import { handleUnknownError, toBase64Url } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
  useModals,
  useUi,
} from '@/composables';

export default defineComponent({
  name: 'JwtSign',
  components: {
    IonPage,
  },
  setup() {
    const route = useRoute();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi();
      const { getAeSdk, nodeNetworkId } = useAeSdk();
      const { openModal } = useModals();
      const { setLoaderVisible } = useUi();
      const { getLastActiveProtocolAccount } = useAccounts();

      try {
        setLoaderVisible(true);
        const payload = route.query.payload?.toString();
        const { host, href, protocol } = callbackOrigin.value || {} as any;

        const signerAddress = getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.address;

        if (!payload) {
          throw new Error('There is no payload to sign');
        }

        if (!signerAddress) {
          throw new Error('Wallet failed to sign the data.');
        }

        const payloadAsJson = JSON.parse(payload);

        payloadAsJson.sub_jwk = {
          kty: 'OKP',
          crv: 'Ed25519',
          x: toBase64Url(decode(signerAddress as Encoded.AccountAddress)),
        };

        const messageToConfirm = `${JWT_HEADER}.${toBase64Url(JSON.stringify(payloadAsJson))}`;

        await openModal(MODAL_CONFIRM_UNSAFE_SIGN, {
          data: messageToConfirm,
          app: {
            host,
            protocol,
            name: host,
            url: href,
          },
        });

        const dataToSign = JSON.parse(payload);

        // Sdk should be initialized in order to get a current networkId.
        await getAeSdk();
        const signedJwt = await signJwt(dataToSign, new AeAccountHdWallet(nodeNetworkId));
        openCallbackOrGoHome(true, { 'signed-payload': signedJwt, address: signerAddress });
      } catch (error: any) {
        openCallbackOrGoHome(false);

        if (error instanceof RejectedByUserError) {
          handleUnknownError(error);
        }
      } finally {
        setLoaderVisible(false);
      }
    });
  },
});
</script>
