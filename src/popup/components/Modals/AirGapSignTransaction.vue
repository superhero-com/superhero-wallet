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
        {{ $t('modals.signAirGapTx.heading') }}
      </div>
    </template>
    <div class="qrcode-wrapper">
      <MultiFragmentsQrCode
        v-if="fragments"
        class="qrcode"
        :value="fragments"
        :size="280"
        :type-number="0"
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
import { IACMessageType } from 'airgap-coin-lib';

import { tg } from '@/popup/plugins/i18n';
import { MODAL_READ_QR_CODE } from '@/constants';
import { isAirgapAccount } from '@/utils';
import {
  useAccounts,
  useModals,
  useAirGap,
  useAeSdk,
} from '@/composables';

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
    resolve: { type: Function as PropType<(txRaw: string) => void>, required: true },
    reject: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const fragments = ref();
    const { openModal } = useModals();
    const { activeAccount } = useAccounts();
    const { nodeNetworkId } = useAeSdk();
    const { generateTransactionURDataFragments, deserializeData } = useAirGap();

    onMounted(async () => {
      if (isAirgapAccount(activeAccount.value)) {
        fragments.value = await generateTransactionURDataFragments(
          activeAccount.value.airGapPublicKey,
          props.txRaw,
          nodeNetworkId?.value!,
        );
      }
    });

    async function scanSignedTransaction() {
      const scanResult: string = await openModal(MODAL_READ_QR_CODE, {
        heading: tg('modals.scanAirGapTx.heading'),
        title: tg('modals.scanAirGapTx.title'),
        icon: 'critical',
      }).catch(() => null); // Closing the modal does nothing

      if (!scanResult) {
        return;
      }

      const deserializedData = await deserializeData(scanResult);

      if (deserializedData?.length) {
        // filter sign transaction type
        const tx = deserializedData.find(
          (item) => item.type === IACMessageType.TransactionSignResponse,
        );
        if (tx) {
          props.resolve((tx.payload as any).transaction);
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
