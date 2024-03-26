<template>
  <div class="transfer-qr-code-generator">
    <MultiFragmentsQrCode
      v-if="fragments"
      :value="fragments"
      :size="280"
      :type-number="0"
      class="qrcode"
    />
    <Loader v-else />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
} from 'vue';
import {
  encode,
  Encoded,
  Encoding,
  Tag,
} from '@aeternity/aepp-sdk';

import type { TransferFormModel } from '@/types';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { isAirgapAccount, toShiftedBigNumber } from '@/utils';
import { aeToAettos } from '@/protocols/aeternity/helpers';
import {
  useAccounts,
  useAirGap,
  useAeSdk,
} from '@/composables';

import MultiFragmentsQrCode from './MultiFragmentsQrCode.vue';
import Loader from './Loader.vue';

export default defineComponent({
  components: {
    MultiFragmentsQrCode,
    Loader,
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
  },
  setup(props) {
    const fragments = ref();

    const { nodeNetworkId, getAeSdk } = useAeSdk();
    const { activeAccount } = useAccounts();
    const { generateTransactionURDataFragments } = useAirGap();

    onMounted(async () => {
      const aeSdk = await getAeSdk();
      const {
        amount: amountRaw,
        address: recipient,
        selectedAsset,
      } = props.transferData;

      if (!amountRaw || !recipient || !selectedAsset || !isAirgapAccount(activeAccount.value)) {
        return null;
      }

      const amount = (selectedAsset.contractId === AE_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : toShiftedBigNumber(amountRaw, -(selectedAsset?.decimals ?? 0));

      const txRaw = await aeSdk.buildTx({
        tag: Tag.SpendTx,
        senderId: activeAccount.value.address as Encoded.AccountAddress,
        recipientId: recipient,
        amount: amount.toString(),
        payload: encode(new TextEncoder().encode(props.transferData.payload), Encoding.Bytearray),
      });

      fragments.value = await generateTransactionURDataFragments(
        activeAccount.value.airGapPublicKey,
        txRaw,
        nodeNetworkId.value!,
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
@use '@/styles/variables' as *;

.transfer-qr-code-generator {
  margin-top: 10px;
  text-align: center;

  .qrcode {
    display: inline-flex;
    padding: 8px;
    background-color: $color-white;
    border-radius: 12px;
  }
}
</style>
