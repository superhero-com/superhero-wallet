<template>
  <Modal
    class="import-account-modal"
    from-bottom
    has-close-button
    @close="resolve"
  >
    <div class="text-center">
      <p
        class="text-heading-2"
        v-text="$t('pages.index.importWallet')"
      />
      <div v-if="discovering">
        <AnimatedSpinnerIcon class="loader" />
        <p class="text-description">
          {{ $t('pages.index.restoringAccounts') }}<br>
          {{ $t('common.actionMayTakeFewMoments') }}
        </p>
      </div>
      <div v-else>
        <p v-text="$t('pages.index.enterSeedPhrase')" />
      </div>
    </div>

    <FormTextarea
      v-model="mnemonic"
      size="xs"
      :label="$t('pages.index.seedPhrase')"
      :placeholder="$t('pages.index.seedPlaceHolder')"
      :message="error"
      :resizable="false"
      :readonly="discovering"
      data-cy="field-mnemonic"
      enter-submit
      @submit="importAccount"
    >
      <template #label-after>
        <a
          data-cy="scan-button"
          class="scan-button"
          :class="{ disabled: discovering }"
          @click="openScanQrModal"
        >
          <QrScanIcon />
        </a>
      </template>
    </FormTextarea>

    <template #footer>
      <BtnMain
        :disabled="!mnemonic || !!error || discovering"
        :text="$t('pages.index.importAccount')"
        data-cy="btn-import"
        class="import-button"
        extend
        center
        @click.prevent="() => importAccount()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { validateMnemonic } from '@aeternity/bip39';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '@/types';
import { MODAL_READ_QR_CODE } from '@/constants';
import { isSeedLengthValid } from '@/utils';
import {
  useAccounts,
  useModals,
  useUi,
} from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?skip-optimize';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    Modal,
    FormTextarea,
    QrScanIcon,
    AnimatedSpinnerIcon,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();
    const { discoverAccounts, setMnemonic } = useAccounts();
    const { openModal } = useModals();
    const { loginTargetLocation, setBackedUpSeed } = useUi();

    const discovering = ref(false);
    const mnemonic = ref('');
    const error = ref<string | TranslateResult>('');

    watch(mnemonic, () => {
      error.value = '';
    });

    async function importAccount() {
      const mnemonicParsed = mnemonic.value
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z ]/g, '')
        .trim();

      if (!isSeedLengthValid(mnemonicParsed)) {
        error.value = t('pages.index.invalidSeed');
        return;
      }
      if (!mnemonicParsed || !validateMnemonic(mnemonicParsed)) {
        error.value = t('pages.index.accountNotFound');
        return;
      }

      discovering.value = true;
      setMnemonic(mnemonicParsed);
      setBackedUpSeed(false);
      await discoverAccounts();
      props.resolve();
      router.push(loginTargetLocation.value);
      discovering.value = false;
    }

    async function openScanQrModal() {
      const scanResult = await openModal(MODAL_READ_QR_CODE, {
        title: t('pages.index.scanSeedPhrase'),
        icon: 'critical',
      });

      if (scanResult) {
        mnemonic.value = scanResult;
      }
    }

    return {
      discovering,
      mnemonic,
      error,
      importAccount,
      openScanQrModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.import-account-modal {
  text-align: center;

  .loader {
    width: 56px;
  }

  .scan-button {
    color: variables.$color-white;
    display: block;
    width: 32px;
    height: 24px;

    &.disabled {
      opacity: 0.4;
      pointer-events: none;
    }
  }
}
</style>
