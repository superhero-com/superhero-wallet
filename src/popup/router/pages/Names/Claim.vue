<template>
  <div class="popup">
    <NameListHeader />
    <div class="claim-name-holder">
      <Input
        v-model="name"
        :placeholder="$t('pages.names.claim.name-placeholder')"
        label=".chain"
        labelPosition="right"
      />
      <Button small @click="claim" :disabled="!sdk">
        <ae-icon name="plus" />
      </Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import NameListHeader from '../../components/NameListHeader';
import Input from '../../components/Input';
import { MAX_AUCTION_NAME_LENGTH } from '../../../utils/constants';

export default {
  components: { NameListHeader, Input },
  data: () => ({ name: '', loading: false }),
  computed: mapGetters(['sdk', 'account']),
  methods: {
    async claim() {
      this.name = this.name.trim();
      let error;
      if (this.name === '') error = 'name-exist';
      else if (!/^[A-Za-z0-9]+$/.test(this.name)) error = 'only-chars';
      else if (this.name.length <= 13) error = 'name-length';

      if (error) this.$store.dispatch('modals/open', { name: 'default', type: error });
      else {
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
            if (e.message === 'Rejected by user') return;
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
            const isAuction = MAX_AUCTION_NAME_LENGTH >= this.name.length;
            if (!isAuction) {
              this.$store.dispatch('names/updatePointer', {
                name,
                address: this.account.publicKey,
              });
            }
          } catch (e) {
            console.log(e);
          } finally {
            this.$store.dispatch('names/fetchOwned');
          }
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
