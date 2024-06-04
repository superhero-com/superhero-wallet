<template>
  <Modal
    class="sign-air-gap-transaction"
    has-close-button
    full-screen
    from-bottom
    @close="reject"
  >
    <ModalHeader
      :subtitle="subtitle"
      no-padding
    >
      <template #title>
        <div class="custom-header-title">
          {{ title }}
          <BtnHelp
            :title="$t('airGap.scan.help.title')"
            :msg="$t('airGap.scan.help.msg')"
            icon="qr-scan"
            full-screen
          />
        </div>
      </template>
    </ModalHeader>

    <!-- First Step -->
    <WrappedQrCode
      v-if="currentStep === STEPS.initial"
      :value="fragments"
      :size="290"
      :type-number="0"
      :external-copied="copied"
    >
      <BtnMain
        class="btn-copy"
        :icon="CopyOutlinedIcon"
        :text="$t('pages.send.copy')"
        variant="muted"
        extend
        @click="copyAsSingleQR()"
      />
    </WrappedQrCode>

    <!-- Second Step -->
    <div v-else class="input-wrapper">
      <FormScanQrResult
        v-model="syncCode"
        class="sync-code-input"
        :label="$t('airGap.syncCode.inputLabel')"
        :placeholder="$t('airGap.syncCode.inputPlaceholder')"
        :qr-title="$t('airGap.scan.title')"
      />
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        :text="secondaryButtonText"
        @click="secondaryButtonAction()"
      />
      <BtnMain
        extra-padded
        :disabled="isMainButtonDisabled"
        :text="mainButtonText"
        @click="mainButtonAction()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { throttle } from 'lodash-es';
import { IACMessageType } from '@airgap/serializer/v3/interfaces';

import { tg } from '@/popup/plugins/i18n';
import { ObjectValues, RejectCallback } from '@/types';
import { getURFromFragments, parseCodeToBytes } from '@/utils';
import {
  useAccounts,
  useAirGap,
  useAeSdk,
  useCopy,
} from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import WrappedQrCode from '@/popup/components/WrappedQrCode.vue';
import ModalHeader from '@/popup/components/ModalHeader.vue';
import FormScanQrResult from '@/popup/components/form/FormScanQrResult.vue';

import CopyOutlinedIcon from '@/icons/copy-outlined.svg?vue-component';

const STEPS = {
  initial: 'initial',
  confirm: 'confirm',
} as const;
type Step = ObjectValues<typeof STEPS>;

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    BtnHelp,
    WrappedQrCode,
    ModalHeader,
    FormScanQrResult,
  },
  props: {
    txRaw: { type: String, required: true },
    resolve: { type: Function as PropType<(txRaw: string) => void>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const currentStep = ref<Step>(STEPS.initial);
    const fragments = ref();
    const syncCode = ref('');
    const signedTransaction = ref();

    const { activeAccount, isActiveAccountAirGap } = useAccounts();
    const { nodeNetworkId } = useAeSdk();
    const { generateTransactionURDataFragments, deserializeData } = useAirGap();
    const { copy, copied } = useCopy();

    const isFirstStep = computed(() => currentStep.value === STEPS.initial);
    const title = computed(() => isFirstStep.value
      ? tg('airGap.send.reviewTitle')
      : tg('airGap.broadcast.title'));
    const subtitle = computed(() => isFirstStep.value
      ? tg('airGap.send.reviewSubtitle')
      : tg('airGap.broadcast.subtitle'));
    const mainButtonText = computed(() => isFirstStep.value
      ? tg('common.next')
      : tg('common.confirm'));
    const secondaryButtonText = computed(() => isFirstStep.value
      ? tg('common.cancel')
      : tg('airGap.broadcast.backToQr'));

    const isMainButtonDisabled = computed(() => (
      currentStep.value === STEPS.confirm
      && !signedTransaction.value
    ));

    function copyAsSingleQR(): void {
      copy(getURFromFragments(fragments.value));
    }

    function mainButtonAction() {
      if (isFirstStep.value) {
        currentStep.value = STEPS.confirm;
      } else if (signedTransaction.value) {
        props.resolve(signedTransaction.value);
      }
    }

    function secondaryButtonAction() {
      if (currentStep.value === STEPS.confirm) {
        currentStep.value = STEPS.initial;
        signedTransaction.value = null;
        syncCode.value = '';
      } else {
        props.reject();
      }
    }

    async function handleInput() {
      if (syncCode.value) {
        let parsedCode;
        try {
          // Codes copied from AirGap need to be parsed
          parsedCode = await parseCodeToBytes(syncCode.value);
        } catch (e) {
          parsedCode = syncCode.value;
        }

        try {
          const deserializedData = await deserializeData(parsedCode!);

          if (deserializedData?.length) {
          // filter sign transaction type
            const tx = deserializedData.find(
              (item) => item.type === IACMessageType.TransactionSignResponse,
            );
            if (tx) {
              signedTransaction.value = (tx.payload as any).transaction;
            } else {
              signedTransaction.value = null;
            }
          }
        } catch (e) {
          signedTransaction.value = null;
        }
      }
    }

    const throttledHandleInput = throttle(handleInput, 100);

    watch(syncCode, throttledHandleInput);

    onMounted(async () => {
      if (isActiveAccountAirGap.value) {
        fragments.value = await generateTransactionURDataFragments(
          activeAccount.value?.publicKey!,
          props.txRaw,
          nodeNetworkId?.value!,
        );
      }
    });

    return {
      fragments,
      copied,
      title,
      subtitle,
      mainButtonText,
      secondaryButtonText,
      isMainButtonDisabled,
      currentStep,
      syncCode,
      copy,
      mainButtonAction,
      secondaryButtonAction,
      copyAsSingleQR,
      STEPS,
      CopyOutlinedIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.sign-air-gap-transaction {
  .custom-header-title {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .btn-copy {
    margin-top: 16px;
  }
}
</style>
