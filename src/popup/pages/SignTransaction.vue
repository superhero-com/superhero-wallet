<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';

import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  buildTx, Encoded, Tag, unpackTx,
} from '@aeternity/aepp-sdk';

import { DEFAULT_WAITING_HEIGHT, PROTOCOLS } from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import { handleUnknownError } from '@/utils';
import {
  useDeepLinkApi,
  useModals,
  useAeSdk,
  useUi,
  useAccounts,
} from '@/composables';

export default defineComponent({
  name: 'SignTransaction',
  components: {
    IonPage,
  },
  setup() {
    const route = useRoute();
    const { t } = useI18n();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi();
      const { nodeNetworkId, getAeSdk } = useAeSdk();
      const { openDefaultModal } = useModals();
      const { setLoaderVisible } = useUi();
      const { getLastActiveProtocolAccount } = useAccounts();

      const aeSdk = await getAeSdk();
      const activeAccountAddress = getLastActiveProtocolAccount(
        PROTOCOLS.aeternity,
      )?.address as Encoded.AccountAddress;

      async function replaceCallerTx(tx: Encoded.Transaction, callerId: Encoded.AccountAddress) {
        const unpackedTx = unpackTx(tx) as ReturnType<typeof unpackTx>
          & { callerId: Encoded.AccountAddress };

        if (unpackedTx.tag === Tag.ContractCallTx || unpackedTx.tag === Tag.ContractCreateTx) {
          unpackedTx.callerId = callerId;
          unpackedTx.nonce = (await aeSdk.api.getAccountByPubkey(callerId)).nonce + 1;
        }

        return buildTx(unpackedTx);
      }

      try {
        setLoaderVisible(true);
        const {
          transaction, networkId, broadcast, 'replace-caller': replaceCaller,
        } = route.query;

        if (networkId !== nodeNetworkId.value) {
          await openDefaultModal({
            icon: 'warning',
            title: t('modals.wrongNetwork.title'),
            msg: t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: t('modals.wrongNetwork.button'),
          });
          openCallbackOrGoHome(false);
          return;
        }

        // replacing the caller might be chosen by an aepp if no wallet connection is available
        // but a transaction should be proposed to the user anyway
        // e.g. to reduce the number of steps necessary in a deep-link environment,
        // from two round trips, aepp -> wallet -> aepp, to one
        const txToSign = replaceCaller === 'true'
          ? await replaceCallerTx(transaction as Encoded.Transaction, activeAccountAddress)
          : transaction;

        const signedTransaction = await aeSdk.signTransaction(
          decodeURIComponent(txToSign as string) as Encoded.Transaction,
          {
            networkId,
            aeppOrigin: callbackOrigin.value?.toString(),
            isSenderReplaced: replaceCaller === 'true',
          } as any,
        );

        if (broadcast) {
          const { txHash } = await aeSdk.api.postTransaction({ tx: signedTransaction });
          await aeSdk.poll(txHash, { blocks: DEFAULT_WAITING_HEIGHT });
          openCallbackOrGoHome(true, { 'transaction-hash': txHash });
        } else {
          openCallbackOrGoHome(true, { transaction: signedTransaction });
        }
      } catch (error: any) {
        await openDefaultModal({
          title: t('modals.transaction-failed.msg'),
          icon: 'critical',
          msg: error.message,
        });
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
