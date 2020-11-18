<template>
  <div class="popup">
    <NameListHeader />
    <div class="claim-name-holder">
      <Input
        v-model="name"
        :placeholder="$t('pages.names.claim.name-placeholder')"
        label=".chain"
        labelPosition="right"
        :error="!validName"
      />
      <Button small @click="claim" :disabled="!sdk || !validName">
        <ae-icon name="plus" />
      </Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import NameListHeader from '../../components/NameListHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { MAX_AUCTION_NAME_LENGTH, MIN_NAME_LENGTH } from '../../../utils/constants';

export default {
  components: { NameListHeader, Input, Button },
  data: () => ({ name: '', loading: false }),
  computed: {
    ...mapState(['sdk']),
    validName() {
      return this.name && /^[A-Za-z0-9]+$/.test(this.name) && this.name.length >= MIN_NAME_LENGTH;
    },
  },
  methods: {
    async claim() {
      this.name = this.name.trim();
      if (!this.validName) return;
      const name = `${this.name}.chain`;
      const nameEntry = await this.sdk.api.getNameEntryByName(name).catch(() => false);
      if (nameEntry) this.$store.dispatch('modals/open', { name: 'default', type: 'name-exist' });
      else {
        this.loading = true;
        let claimTxHash;
        try {
          const { salt } = await this.sdk.aensPreclaim(name);
          claimTxHash = (await this.sdk.aensClaim(name, salt, { waitMined: false })).hash;
          this.$router.push({ name: 'name-list' });
        } catch (e) {
          let msg = e.message;
          if (msg.includes('is not enough to execute')) {
            msg = this.$t('pages.names.balance-error');
          }
          this.$store.dispatch('modals/open', { name: 'default', msg });
          return;
        } finally {
          this.loading = false;
        }

        try {
          this.$store.dispatch('names/fetchOwned');
          await this.sdk.poll(claimTxHash);
          const isAuction = MAX_AUCTION_NAME_LENGTH >= name.length;
          if (!isAuction) {
            this.$store.dispatch('names/updatePointer', {
              name,
              address: this.$store.getters.account.publicKey,
            });
          }
        } catch (e) {
          this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
        } finally {
          this.$store.dispatch('names/fetchOwned');
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.claim-name-holder {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;

  .input-group {
    margin-left: 0;
  }

  .primary-button {
    margin-right: 0;
  }
}
</style>
