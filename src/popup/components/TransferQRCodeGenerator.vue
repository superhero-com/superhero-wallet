<template>
  <div class="qrcode-wrapper">
    <QrCode
      v-if="transactionUR"
      :value="transactionUR"
      :size="280"
      :type-number="0"
      class="qrcode"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import { useGetter } from '../../composables/vuex';
import { useAccounts, useAirGap, useSdk } from '../../composables';

import type { INetwork } from '../../types';

import QrCode from './QrCode.vue';
import { TransferFormModel } from './Modals/TransferSend.vue';
import { AETERNITY_CONTRACT_ID, aeToAettos, convertToken } from '../utils';

export default defineComponent({
  components: {
    QrCode,
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
  },
  setup(props, { root }) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const { getSdk } = useSdk({ store: root.$store });
    const { account } = useAccounts({ store: root.$store });
    const { generateEncodedTransactionSignRequestUR } = useAirGap({ store: root.$store });
    const transactionUR = ref();

    onMounted(async () => {
      const sdk = await getSdk();
      const {
        amount: amountRaw,
        address: recipient,
        selectedAsset,
      } = props.transferData;

      if (!amountRaw || !recipient || !selectedAsset || !account.value.airGapPublicKey) {
        return null;
      }

      const amount = (selectedAsset.contractId === AETERNITY_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : convertToken(amountRaw, selectedAsset.decimals);

      const txRaw = await sdk.spendTx({
        senderId: account.value.address,
        recipientId: recipient,
        amount,
        payload: props.transferData.payload,
      });
      transactionUR.value = await generateEncodedTransactionSignRequestUR(
        account.value.airGapPublicKey,
        txRaw,
        activeNetwork.value.networkId,
      );
      return null;
    });

    return {
      transactionUR,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.qrcode-wrapper {
  margin-top: 10px;
  text-align: center;

  .qrcode {
    display: inline-flex;
    padding: 8px;
    background-color: variables.$color-white;
    border-radius: 12px;
  }
}
</style>
