<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { isPlainObject } from 'lodash-es';
import { AccountBase, Encoded, signJwt } from '@aeternity/aepp-sdk';

import { AeAccountHdWallet } from '@/protocols/aeternity/libs/AeAccountHdWallet';
import { withSubJwk } from '@/protocols/aeternity/helpers';
import {
  MODAL_CONFIRM_UNSAFE_SIGN,
  PROTOCOLS,
} from '@/constants';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import Logger from '@/lib/logger';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
  useModals,
  useUi,
} from '@/composables';
import type { IAppData, ISignModalResolution } from '@/types';

export default defineComponent({
  name: 'JwtSign',
  components: {
    IonPage,
  },
  setup() {
    const route = useRoute();
    const { t } = useI18n();

    /** JWT claims are a JSON object */
    function parseClaims(payload: string): Record<string, unknown> {
      let claims: unknown;
      try {
        claims = JSON.parse(payload);
      } catch {
        // Rejected below
      }
      if (!isPlainObject(claims)) {
        throw new Error(t('pages.jwtSign.invalidPayload'));
      }
      return claims as Record<string, unknown>;
    }

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

        const activeAddress = getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.address;

        if (!payload) {
          throw new Error(t('pages.jwtSign.noPayload'));
        }

        if (!activeAddress) {
          throw new Error(t('pages.jwtSign.wrongProtocol'));
        }

        const claims = parseClaims(payload);

        const { selectedAddress } = await openModal<ISignModalResolution>(
          MODAL_CONFIRM_UNSAFE_SIGN,
          { jwtClaims: JSON.stringify(claims), app },
        );
        // The user can pick another account on the confirmation
        const signerAddress = (selectedAddress || activeAddress) as Encoded.AccountAddress;

        // Sdk should be initialized in order to get a current networkId.
        await getAeSdk();
        const wallet = new AeAccountHdWallet(nodeNetworkId);
        // `signJwt` doesn't pass on options, so the signer is named here
        const signer = {
          address: signerAddress,
          unsafeSign: (data: string | Uint8Array) => (
            wallet.unsafeSign(data, { fromAccount: signerAddress })
          ),
        } as AccountBase;
        const signedJwt = await signJwt(withSubJwk(claims, signerAddress), signer);
        await openCallbackOrGoHome(true, { 'signed-payload': signedJwt, address: signerAddress });
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
        await openCallbackOrGoHome(false);
      } finally {
        setLoaderVisible(false);
      }
    });
  },
});
</script>
