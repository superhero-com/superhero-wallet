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
        :error-message="error"
        new-ui
      />
    </div>
    <Button
      :disabled="!mnemonic || (error != null)"
      data-cy="import"
      class="import-button"
      new-ui
      extend
      @click="importAccount"
    >
      {{ $t('pages.index.importAccount') }}
    </Button>
  </Modal>
</template>

<script>
import { validateMnemonic } from '@aeternity/bip39';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import FormTextarea from '../FormTextarea.vue';
import { validateSeedLength } from '../../../utils/helper';

export default {
  components: {
    Button,
    Modal,
    FormTextarea,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  data: () => ({
    mnemonic: '',
    error: null,
  }),
  watch: {
    mnemonic() {
      this.error = null;
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
      await this.$router.push(this.$store.state.loginTargetLocation);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

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

  .import-button {
    margin-top: 80px;
  }
}
</style>
