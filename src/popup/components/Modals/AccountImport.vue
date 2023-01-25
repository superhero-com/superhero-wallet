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

<script>
import { validateMnemonic } from '@aeternity/bip39';
import { validateSeedLength, watchUntilTruthy } from '../../utils';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import FormTextarea from '../form/FormTextarea.vue';

export default {
  components: {
    BtnMain,
    Modal,
    FormTextarea,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  data: () => ({
    mnemonic: '',
    error: '',
  }),
  watch: {
    mnemonic() {
      this.error = '';
    },
  },
  methods: {
    async importAccount() {
      const mnemonic = this.mnemonic
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z ]/g, '')
        .trim();
      if (!validateSeedLength(mnemonic)) {
        this.error = this.$t('pages.index.invalidSeed');
        return;
      }
      if (!mnemonic || !validateMnemonic(mnemonic)) {
        this.error = this.$t('pages.index.accountNotFound');
        return;
      }
      this.$store.commit('setMnemonic', mnemonic);
      this.$store.commit('setBackedUpSeed');
      this.resolve();
      setTimeout(async () => {
        await watchUntilTruthy(() => this.$store.getters['sdkPlugin/sdk']);
        this.$store.dispatch('accounts/hdWallet/discover');
      }, 100);
      this.$router.push(this.$store.state.loginTargetLocation);
    },
  },
};
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
