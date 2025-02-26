<template>
  <Modal
    class="account-import-modal"
    from-bottom
    has-close-button
    @close="resolve"
  >
    <div class="text-center">
      <p
        class="text-heading-4"
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
        <BtnIcon
          :icon="QrScanIcon"
          :disabled="discovering"
          data-cy="scan-button"
          @click="scanAccountQrCode()"
        />
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
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '@/types';
import { isSeedLengthValid } from '@/utils';
import {
  useAccounts,
  useAuth,
  useModals,
  useUi,
} from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?vue-component';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    BtnIcon,
    Modal,
    FormTextarea,
    AnimatedSpinnerIcon,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();
    const { discoverAccounts } = useAccounts();
    const { openScanQrModal } = useModals();
    const { setMnemonicAndInitializeAuthentication } = useAuth();
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
      if (!mnemonicParsed || !validateMnemonic(mnemonicParsed, wordlist)) {
        error.value = t('pages.index.accountNotFound');
        return;
      }

      try {
        await setMnemonicAndInitializeAuthentication(mnemonicParsed);
        discovering.value = true;
        setBackedUpSeed(true);
        await discoverAccounts();
        props.resolve();
        router.push(loginTargetLocation.value);
      } catch {
        error.value = t('pages.index.passwordWasNotSet');
      } finally {
        discovering.value = false;
      }
    }

    async function scanAccountQrCode() {
      const scanResult = await openScanQrModal({
        title: t('pages.index.scanSeedPhrase'),
      });

      if (scanResult) {
        mnemonic.value = scanResult;
      }
    }

    return {
      QrScanIcon,
      discovering,
      mnemonic,
      error,
      importAccount,
      scanAccountQrCode,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.account-import-modal {
  text-align: center;

  .loader {
    width: 56px;
  }
}
</style>
