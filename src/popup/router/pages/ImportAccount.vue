<template>
  <div class="popup">
    <Loader v-if="loading" type="none" />
    <template v-else>
      <p class="regular-text">{{ $t('pages.index.enterSeedPhrase') }}</p>
      <Textarea v-model="mnemonic" :error="error" />
      <Button @click="importAccount" :disabled="!mnemonic || error" data-cy="import">
        {{ $t('pages.index.importAccount') }}
      </Button>
      <div v-if="error" class="error-msg">
        {{ $t('pages.index.accountNotFound') }}<br />
        {{ $t('pages.index.checkSeed') }}
      </div>
    </template>
  </div>
</template>

<script>
import { mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';
import { deferPromised } from '../../utils/index';
import Textarea from '../components/Textarea';
import Button from '../components/Button';

export default {
  components: { Textarea, Button },
  data: () => ({
    mnemonic: '',
    loading: false,
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
      this.loading = true;
      const seed = (await deferPromised(mnemonicToSeed, mnemonic)).toString('hex');
      const address = await this.$store.dispatch('generateWallet', { seed });
      this.$store.commit('setMnemonic', this.mnemonic);
      this.$store.commit('setBackedUpSeed');
      await this.$store.dispatch('setLogin', {
        keypair: {
          address,
          privateKey: seed,
        },
      });
      await this.$router.push(this.$store.state.loginTargetLocation);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.regular-text {
  font-size: $base-font-size;
  text-align: left;
  font-weight: normal;
}
</style>
