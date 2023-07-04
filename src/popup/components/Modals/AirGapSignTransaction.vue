<template>
  <Modal
    class="air-gap-sign-transaction"
    has-close-button
    from-bottom
    no-padding
    @close="reject"
  >
    <template #header>
      <div class="title">
        {{ $t('modals.scanSignedAirGapTx.heading') }}
      </div>
    </template>
    <div class="qrcode-wrapper">
      <MultiFragmentsQrCode
        v-if="fragments"
        :value="fragments"
        :size="280"
        :type-number="0"
        class="qrcode"
      />
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="reject()"
      />
      <BtnMain
        extra-padded
        :icon="QrScanIcon"
        :text="$t('common.scan')"
        @click="scanSignedTransaction()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
} from 'vue';
import { IACMessageType } from '@airgap/serializer';
import type {
  IACMessageDefinitionObjectV3,
  TransactionSignResponse,
} from '@airgap/serializer';

import type { INetwork } from '@/types';
import { MODAL_READ_QR_CODE } from '@/constants';
import { useAccounts, useModals, useAirGap } from '@/composables';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import MultiFragmentsQrCode from '../MultiFragmentsQrCode.vue';

import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    MultiFragmentsQrCode,
  },
  props: {
    txRaw: { type: String, required: true },
    // eslint-disable-next-line no-unused-vars
    resolve: { type: Function as PropType<(txRaw: string) => void>, required: true },
    reject: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const fragments = ref();
    const { openModal } = useModals();
    const { activeAccount } = useAccounts();
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const { generateTransactionURDataFragments } = useAirGap();

    onMounted(async () => {
      fragments.value = await generateTransactionURDataFragments(
        activeAccount.value.airGapPublicKey as string,
        props.txRaw,
        activeNetwork.value.networkId,
      );
    });

    async function scanSignedTransaction() {
      const scanResult: IACMessageDefinitionObjectV3[] = await openModal(MODAL_READ_QR_CODE, {
        heading: tg('modals.scanAirGapTx.heading'),
        title: tg('modals.scanAirGapTx.title'),
        icon: 'critical',
      });

      if (scanResult?.length) {
        // filter sign transaction type
        const tx = scanResult.find((item) => item.type === IACMessageType.TransactionSignResponse);
        if (tx) {
          props.resolve((tx.payload as TransactionSignResponse).transaction);
        } else {
          props.reject();
        }
      }
    }

    return {
      fragments,
      scanSignedTransaction,
      QrScanIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.air-gap-sign-transaction {
  .title {
    @extend %face-sans-15-medium;

    color: rgba(variables.$color-white, 0.75);
    text-align: left;
    padding: 12px;
  }

  .qrcode-wrapper {
    margin-top: 10px;
    text-align: center;

    .qrcode {
      display: inline-flex;
      padding: 8px;
      background-color: $color-white;
      border-radius: 12px;
    }
  }
}
</style>
