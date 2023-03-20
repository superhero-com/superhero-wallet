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
} from '@vue/composition-api';
import { TranslateResult } from 'vue-i18n';
import { validateMnemonic } from '@aeternity/bip39';
import type { ResolveRejectCallback } from '../../../types';
import { validateSeedLength } from '../../utils';
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
    resolve: { type: Function as PropType<ResolveRejectCallback>, required: true },
    reject: { type: Function as PropType<ResolveRejectCallback>, required: true },
  },
  setup(props, { root }) {
    const { getSdk } = useSdk({ store: root.$store });

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
        error.value = root.$t('pages.index.invalidSeed');
        return;
      }
      if (!mnemonicParsed || !validateMnemonic(mnemonicParsed)) {
        error.value = root.$t('pages.index.accountNotFound');
        return;
      }
      root.$store.commit('setMnemonic', mnemonicParsed);
      root.$store.commit('setBackedUpSeed');
      props.resolve();
      setTimeout(async () => {
        await getSdk();
        root.$store.dispatch('accounts/hdWallet/discover');
      }, 100);
      root.$router.push(root.$store.state.loginTargetLocation);
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
