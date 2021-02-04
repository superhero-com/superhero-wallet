<template>
  <div class="popup">
    <Loader v-if="loading" type="none" />
    <template v-else>
      <p class="regular-text">{{ $t('pages.index.enterSeedPhrase') }}</p>
      <Textarea v-model="mnemonic" :error="errorMsg ? true : false" />
      <Button
        @click="importAccount"
        :disabled="mnemonic && !disabled ? false : true"
        data-cy="import"
      >
        {{ $t('pages.index.importAccount') }}
      </Button>
      <div v-if="errorMsg" class="error-msg" v-html="errorMsg"></div>
    </template>
  </div>
</template>

<script>
import { mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';
import Textarea from '../components/Textarea';
import Button from '../components/Button';

export default {
  components: { Textarea, Button },
  data() {
    return {
      mnemonic: null,
      errorMsg: null,
      loading: false,
      disabled: false,
    };
  },
  watch: {
    mnemonic() {
      this.disabled = false;
      this.errorMsg = null;
    },
  },
  methods: {
    async importAccount() {
      this.loading = true;
      if (this.mnemonic) {
        this.mnemonic = this.mnemonic.trim();
        const mnemonic = this.mnemonic.split(' ');
        if (mnemonic.length >= 12 && mnemonic.length <= 24 && validateMnemonic(this.mnemonic)) {
          this.errorMsg = null;
          const seed = mnemonicToSeed(this.mnemonic).toString('hex');
          const address = await this.$store.dispatch('generateWallet', { seed });
          this.$store.commit('setMnemonic', this.mnemonic);
          const keypair = {
            publicKey: address,
            privateKey: seed,
          };
          this.$store.commit('setBackedUpSeed');
          await this.$store.dispatch('setLogin', { keypair });
          return setTimeout(() => this.$router.push(this.$store.state.loginTargetLocation), 1000);
        }
        this.disabled = true;
        this.errorMsg = `${this.$t('pages.index.accountNotFound')} <br> ${this.$t(
          'pages.index.checkSeed',
        )}`;
      } else {
        this.disabled = true;
        this.errorMsg = `${this.$t('pages.index.accountNotFound')} <br> ${this.$t(
          'pages.index.checkSeed',
        )}`;
      }
      this.loading = false;
      return false;
    },
    validateMnemonic() {
      return validateMnemonic(this.mnemonic);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.regular-text {
  font-size: $font-size;
  text-align: left;
  font-weight: normal;
}
</style>
