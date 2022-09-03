<template>
  <Modal
    class="import-account-modal"
    from-bottom
  >
    <ButtonPlain @click="resolve">
      <Close />
    </ButtonPlain>
    <div class="import-account">
      <span class="header"> {{ $t('pages.index.importWallet') }} </span>
      <p class="regular-text">
        {{ $t('pages.index.enterSeedPhrase') }}
      </p>

      <FormTextarea
        v-model="mnemonic"
        size="sm"
        :label="$t('pages.index.seedPhrase')"
        :placeholder="$t('pages.index.seedPlaceHolder')"
        :error-message="error"
      />

      <Button
        :disabled="!mnemonic || (error != null)"
        data-cy="import"
        class="button"
        @click="importAccount"
      >
        {{ $t('pages.index.importAccount') }}
      </Button>
    </div>
  </Modal>
</template>

<script>
import { validateMnemonic } from '@aeternity/bip39';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import ButtonPlain from '../ButtonPlain.vue';
import Close from '../../../../icons/close.svg?vue-component';
import FormTextarea from '../FormTextarea.vue';
import { validateSeedLength } from '../../../utils/helper';

export default {
  components: {
    Button,
    Modal,
    ButtonPlain,
    Close,
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

  .button-plain {
      width: 24px;
      height: 24px;
      position: absolute;
      right: 7px;
      top: 7px;
      color: variables.$color-white;

      svg {
        width: 24px;
      }
    }
  .import-account  {

    .header {
      @extend %face-sans-18-bold;

      color: variables.$color-white;
      margin-bottom: 8px;
    }

    .regular-text {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
      text-align: center;
      margin-bottom: 24px;
    }

  }

  .button {
    width: 100%;
    margin-top: 80px;
  }
}
</style>
