<template>
  <div class="import-account">
    <p class="regular-text">
      {{ $t('pages.index.enterSeedPhrase') }}
    </p>
    <FormTextarea
      v-model="mnemonic"
      :error="error"
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
      {{ $t('pages.index.checkSeed') }}
    </div>
  </div>
</template>

<script>
import { validateMnemonic } from '@aeternity/bip39';
import FormTextarea from '../components/FormTextarea.vue';
import Button from '../components/Button.vue';

export default {
  components: {
    FormTextarea,
    Button,
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
@use '../../../styles/variables';

.import-account .regular-text {
  font-size: variables.$base-font-size;
  text-align: left;
  font-weight: normal;
}
</style>
