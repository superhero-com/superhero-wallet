<template>
  <Modal
    class="import-account-modal"
    from-bottom
    has-close-button
    @close="resolve"
  >
    <div class="import-account">
      <span class="header"> {{ $t('pages.index.importWallet') }} </span>
      <p class="regular-text">
        {{ $t('pages.index.enterSeedPhrase') }}
      </p>

      <FormTextarea
        v-model="mnemonic"
        size="xs"
        :label="$t('pages.index.seedPhrase')"
        :placeholder="$t('pages.index.seedPlaceHolder')"
        :message="error"
        :resizable="false"
        enter-submit
        @submit="importAccount"
      />
    </div>

    <template #footer>
      <BtnMain
        :disabled="!mnemonic || !!error"
        data-cy="import"
        class="import-button"
        extend
        center
        @click="importAccount"
      >
        {{ $t('pages.index.importAccount') }}
      </BtnMain>
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
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '../../../types';
import {
  validateSeedLength,
  watchUntilTruthy,
} from '../../utils';
import { useSdk } from '../../../composables';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import FormTextarea from '../form/FormTextarea.vue';

export default defineComponent({
  components: {
    BtnMain,
    Modal,
    FormTextarea,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    const { isSdkReady } = useSdk({ store });

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

      if (!validateSeedLength(mnemonicParsed)) {
        error.value = t('pages.index.invalidSeed');
        return;
      }
      if (!mnemonicParsed || !validateMnemonic(mnemonicParsed)) {
        error.value = t('pages.index.accountNotFound');
        return;
      }
      store.commit('setMnemonic', mnemonicParsed);
      store.commit('setBackedUpSeed');
      props.resolve();
      setTimeout(async () => {
        watchUntilTruthy(() => isSdkReady.value).then(
          () => { store.dispatch('accounts/hdWallet/discover'); },
        );
      }, 1000);
      router.push(store.state.loginTargetLocation);
    }

    return {
      mnemonic,
      error,
      importAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.import-account-modal {
  text-align: center;

  .import-account {
    .header {
      @extend %face-sans-18-medium;

      color: variables.$color-white;
    }

    .regular-text {
      @extend %face-sans-16-light;

      color: variables.$color-white;
      text-align: center;
      margin-bottom: 24px;
      margin-top: 8px;
    }
  }
}
</style>
