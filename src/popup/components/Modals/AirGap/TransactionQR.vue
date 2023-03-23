<template>
  <Modal
    full-screen
    has-close-button
    dense
    class="transaction-qr"
    @close="cancel()"
  >
    <template #header>
      <div class="title">
        Open AirGap Vault and scan this transaction in order to sign it.
      </div>
    </template>
    <div>
      <div class="qrcode-wrapper">
        <QrCode
          v-if="transactionUR"
          :value="transactionUR"
          :size="280"
          :type-number="0"
          class="qrcode"
        />
      </div>
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('modals.cancel')"
        @click="cancel()"
      />
      <BtnMain
        extra-padded
        text="Scan QR"
        @click="confirm()"
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
} from '@vue/composition-api';
import { useGetter } from '../../../../composables/vuex';
import { useAirGap } from '../../../../composables';

import type { INetwork } from '../../../../types';

import Modal from '../../Modal.vue';
import BtnMain from '../../buttons/BtnMain.vue';
import QrCode from '../../QrCode.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    QrCode,
  },
  props: {
    resolve: {
      type: Function as PropType<() => void>,
      required: true,
    },
    reject: { type: Function as PropType<() => void>, required: true },
    txRaw: { type: Object, required: true },
  },
  setup(props, { root }) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const { generateTransactionSignRequestUR } = useAirGap({ store: root.$store });
    const transactionUR = ref();
    function confirm() {
      props.resolve();
    }

    function cancel() {
      props.reject();
    }

    onMounted(async () => {
      const publicKey = '2bb14909d0882348ad637f9997fce00432173bc009f0bbade557af69377dc772';
      const tx = await generateTransactionSignRequestUR(
        publicKey,
        props.txRaw.txBase64,
        activeNetwork.value.networkId,
      );
      transactionUR.value = (await tx.nextPart()).toUpperCase();
    });

    return {
      confirm,
      cancel,
      transactionUR,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';
@use '../../../../styles/mixins';

.transaction-qr {
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
      background-color: variables.$color-white;
      border-radius: 12px;
    }
  }
}
</style>
