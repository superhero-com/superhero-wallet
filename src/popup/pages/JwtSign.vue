<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { Encoded, decode, signJwt } from '@aeternity/aepp-sdk';

import { AeAccountHdWallet } from '@/protocols/aeternity/libs/AeAccountHdWallet';
import {
  JWT_HEADER,
  MODAL_CONFIRM_UNSAFE_SIGN,
  PROTOCOLS,
} from '@/constants';
import { handleUnknownError, toBase64Url } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import Logger from '@/lib/logger';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
  useModals,
  useUi,
} from '@/composables';
import { IAppData } from '@/types';

export default defineComponent({
  name: 'JwtSign',
  components: {
    IonPage,
  },
  setup() {
    const route = useRoute();
    const { t } = useI18n();

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
        const app = host && href
          ? {
            host,
            name: host,
            href,
            protocol,
          } : {} as IAppData;

        const signerAddress = getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.address;

        if (!payload) {
          throw new Error(t('pages.jwtSign.noPayload'));
        }

        if (!signerAddress) {
          throw new Error(t('pages.jwtSign.wrongProtocol'));
        }

        const payloadAsJson = JSON.parse(payload);

        payloadAsJson.sub_jwk = {
          kty: 'OKP',
          crv: 'Ed25519',
          x: toBase64Url(decode(signerAddress as Encoded.AccountAddress)),
        };

        const messageToConfirm = `${JWT_HEADER}.${toBase64Url(JSON.stringify(payloadAsJson) as any)}`;

        await openModal(MODAL_CONFIRM_UNSAFE_SIGN, {
          data: messageToConfirm,
          app,
        });

        const dataToSign = JSON.parse(payload);

        // Sdk should be initialized in order to get a current networkId.
        await getAeSdk();
        const signedJwt = await signJwt(dataToSign, new AeAccountHdWallet(nodeNetworkId));
        openCallbackOrGoHome(true, { 'signed-payload': signedJwt, address: signerAddress });
      } catch (error: any) {
        if (error instanceof RejectedByUserError) {
          handleUnknownError(error);
        } else {
          await Logger.write({
            title: t('pages.jwtSign.signingFailedTitle'),
            message: error.message || t('pages.jwtSign.signingFailedMessage'),
            type: 'api-response',
            modal: true,
          });
        }
        openCallbackOrGoHome(false);
      } finally {
        setLoaderVisible(false);
      }
    });
  },
});
</script>
