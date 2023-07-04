<template>
  <div class="transfer-qr-code-generator">
    <MultiFragmentsQrCode
      v-if="fragments"
      :value="fragments"
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

import MultiFragmentsQrCode from './MultiFragmentsQrCode.vue';
import { TransferFormModel } from './Modals/TransferSend.vue';
import { AETERNITY_CONTRACT_ID, aeToAettos, convertToken } from '../utils';

export default defineComponent({
  components: {
    MultiFragmentsQrCode,
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
  },
  setup(props, { root }) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const { getSdk } = useSdk({ store: root.$store });
    const { activeAccount } = useAccounts({ store: root.$store });
    const { generateTransactionURDataFragments } = useAirGap();
    const fragments = ref();

    onMounted(async () => {
      const sdk = await getSdk();
      const {
        amount: amountRaw,
        address: recipient,
        selectedAsset,
      } = props.transferData;

      if (!amountRaw || !recipient || !selectedAsset || !activeAccount.value.airGapPublicKey) {
        return null;
      }

      const amount = (selectedAsset.contractId === AETERNITY_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : convertToken(amountRaw, selectedAsset.decimals);

      const txRaw = await sdk.spendTx({
        senderId: activeAccount.value.address,
        recipientId: recipient,
        amount,
        payload: props.transferData.payload,
      });
      fragments.value = await generateTransactionURDataFragments(
        activeAccount.value.airGapPublicKey,
        txRaw,
        activeNetwork.value.networkId,
      );
      return null;
    });

    return {
      fragments,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.transfer-qr-code-generator {
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
