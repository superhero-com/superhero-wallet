<template>
  <Modal
    class="air-gap-sign-transaction"
    has-close-button
    full-screen
    from-bottom
    no-padding
    @close="reject"
  >
    <ModalHeader
      no-padding
      :subtitle="subtitle"
    >
      <template #title>
        <div class="custom-header-title">
          {{ title }}
          <BtnHelp
            :title="$t('modals.scanAirGapTx.help.title')"
            :msg="$t('modals.scanAirGapTx.help.msg')"
            icon="qr-scan"
            full-screen
          />
        </div>
      </template>
    </ModalHeader>
    <!-- First Step -->
    <div
      v-if="currentStep === STEPS.initial"
      class="qrcode-wrapper"
    >
      <QrCode
        v-if="fragments"
        class="qrcode"
        :value="fragments"
        :size="290"
        :type-number="0"
        :external-copied="copied"
      />
      <BtnMain
        class="btn-copy"
        :icon="CopyOutlinedIcon"
        :text="$t('pages.send.copy')"
        variant="muted"
        extend
        @click="copyAsSingleQR()"
      />
    </div>
    <!-- Second Step -->
    <div v-else class="input-wrapper">
      <FormInputWithQr
        v-model="syncCode"
        class="sync-code-input"
        qr-icon="critical"
        :label="$t('modals.airGapSyncCode.inputLabel')"
        :placeholder="$t('modals.airGapSyncCode.inputPlaceholder')"
        :qr-title="$t('modals.scanAirGapTx.title')"
        @update:model-value="throttledHandleInput"
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
} from 'vue';
import { throttle } from 'lodash-es';
import { IACMessageType } from '@airgap/serializer/v3/interfaces';

import { tg } from '@/popup/plugins/i18n';
import { ObjectValues } from '@/types';
import { getURFromFragments, isAirgapAccount, parseCodeToBytes } from '@/utils';
import {
  useAccounts,
  useAirGap,
  useAeSdk,
  useCopy,
} from '@/composables';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import BtnHelp from '../buttons/BtnHelp.vue';
import QrCode from '../QrCode.vue';
import ModalHeader from '../ModalHeader.vue';
import FormInputWithQr from '../form/FormInputWithQr.vue';

import CopyOutlinedIcon from '../../../icons/copy-outlined.svg?vue-component';

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
    QrCode,
    ModalHeader,
    FormInputWithQr,
  },
  props: {
    txRaw: { type: String, required: true },
    resolve: { type: Function as PropType<(txRaw: string) => void>, required: true },
    reject: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const currentStep = ref<Step>(STEPS.initial);
    const fragments = ref();
    const syncCode = ref('');
    const signedTransaction = ref();

    const { activeAccount } = useAccounts();
    const { nodeNetworkId } = useAeSdk();
    const { generateTransactionURDataFragments, deserializeData } = useAirGap();
    const { copy, copied } = useCopy();

    const isFirstStep = computed(() => currentStep.value === STEPS.initial);
    const title = computed(() => isFirstStep.value
      ? tg('modals.airGapSend.reviewTitle')
      : tg('modals.sendAirGapTx.title'));
    const subtitle = computed(() => isFirstStep.value
      ? tg('modals.airGapSend.reviewSubtitle')
      : tg('modals.sendAirGapTx.subtitle'));
    const mainButtonText = computed(() => isFirstStep.value
      ? tg('common.next')
      : tg('common.confirm'));
    const secondaryButtonText = computed(() => isFirstStep.value
      ? tg('common.cancel')
      : tg('modals.sendAirGapTx.backToQr'));

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

    onMounted(async () => {
      if (isAirgapAccount(activeAccount.value)) {
        fragments.value = await generateTransactionURDataFragments(
          activeAccount.value.airGapPublicKey,
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
      throttledHandleInput,
      STEPS,
      CopyOutlinedIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.air-gap-sign-transaction {
  .custom-header-title {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
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

    .btn-copy {
      margin-top: 16px;
    }
  }

  .input-wrapper,
  .qrcode-wrapper{
    padding: 0 24px;
  }
}
</style>
