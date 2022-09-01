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
      <Textarea
        v-model="mnemonic"
        :error="error"
        :placeholder="$t('pages.index.seedPlaceHolder')"
        :label="$t('pages.index.seedPhrase')"
      />
      <Button
        :disabled="!mnemonic || error"
        data-cy="import"
        @click="importAccount"
      >
        {{ $t('pages.index.importAccount') }}
      </Button>
      <div
        v-if="error"
        class="error-msg"
      >
        {{ $t('pages.index.accountNotFound') }}<br>
        {{ $t('pages.index.invalidSeed') }}
      </div>
    </div>
  </Modal>
</template>

<script>
import { validateMnemonic } from '@aeternity/bip39';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import Textarea from '../Textarea.vue';
import ButtonPlain from '../ButtonPlain.vue';
import Close from '../../../../icons/close.svg?vue-component';

export default {
  components: {
    Button,
    Modal,
    Textarea,
    ButtonPlain,
    Close,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  data: () => ({
    mnemonic: '',
    error: false,
  }),
  watch: {
    mnemonic() {
      this.error = false;
    },
  },
  methods: {
    async importAccount() {
      const mnemonic = this.mnemonic
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z ]/g, '')
        .trim();
      if (!mnemonic || !validateMnemonic(mnemonic)) {
        this.error = true;
        return;
      }
      this.$store.commit('setMnemonic', mnemonic);
      this.$store.commit('setBackedUpSeed');
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
}
</style>
