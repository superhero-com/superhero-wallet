<template>
  <div class="transfer-qr-code-generator">
    <template
      v-if="fragments"
    >
      <QrCode
        :value="fragments"
        :size="290"
        :type-number="0"
        :external-copied="copied"
        class="qrcode"
      />
      <BtnMain
        class="btn-copy"
        :icon="CopyOutlinedIcon"
        :text="$t('pages.send.copy')"
        variant="muted"
        extend
        @click="copyAsSingleQR()"
      />
    </template>
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
import { getURFromFragments, isAirgapAccount, toShiftedBigNumber } from '@/utils';
import { aeToAettos } from '@/protocols/aeternity/helpers';
import {
  useAccounts,
  useAirGap,
  useAeSdk,
  useCopy,
} from '@/composables';

import QrCode from './QrCode.vue';
import Loader from './Loader.vue';
import BtnMain from './buttons/BtnMain.vue';

import CopyOutlinedIcon from '../../icons/copy-outlined.svg?vue-component';

export default defineComponent({
  components: {
    QrCode,
    Loader,
    BtnMain,
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
  },
  setup(props) {
    const fragments = ref();

    const { nodeNetworkId, getAeSdk } = useAeSdk();
    const { activeAccount } = useAccounts();
    const { generateTransactionURDataFragments } = useAirGap();
    const { copy, copied } = useCopy();

    function copyAsSingleQR(): void {
      copy(getURFromFragments(fragments.value));
    }

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
      CopyOutlinedIcon,
      copied,
      copyAsSingleQR,
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

  .btn-copy {
    margin-top: 16px;
  }
}
</style>
