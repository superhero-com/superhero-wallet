<template>
  <div class="claim">
    <NameListHeader />
    <div class="claim-name-holder">
      <InputField
        v-model="name"
        :placeholder="$t('pages.names.claim.name-placeholder')"
        :error="!validName"
      >
        <span slot="right">.chain</span>
      </InputField>
      <Button
        small
        :disabled="!sdk || !validName"
        @click="claim"
      >
        <ae-icon name="plus" />
      </Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import NameListHeader from '../../components/NameListHeader';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { MAX_AUCTION_NAME_LENGTH } from '../../../utils/constants';

export default {
  components: { NameListHeader, InputField, Button },
  data: () => ({ name: '', loading: false }),
  computed: {
    ...mapState(['sdk']),
    validName() {
      return this.name && /^[A-Za-z0-9]+$/.test(this.name);
    },
  },
  methods: {
    async claim() {
      this.name = this.name.trim();
      if (!this.validName) return;
      const name = `${this.name}.chain`;
      const nameEntry = await this.sdk.api.getNameEntryByName(name).catch(() => false);
      if (nameEntry) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.name-exist.msg'),
        });
      } else {
        this.loading = true;
        let claimTxHash;
        try {
          const { salt } = await this.sdk.aensPreclaim(name);
          claimTxHash = (await this.sdk.aensClaim(name, salt, { waitMined: false })).hash;
          this.$router.push({ name: 'name-list' });
        } catch (e) {
          let msg = e.message;
          if (msg.includes('is not enough to execute') || e.statusCode === 404) {
            msg = this.$t('pages.names.balance-error');
          }
          this.$store.dispatch('modals/open', { name: 'default', icon: 'critical', title: msg });
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
              address: this.$store.getters.account.address,
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
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.claim {
  .claim-name-holder {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30px;

    .input-field span {
      @extend %face-sans-14-regular;

      color: variables.$color-dark-grey;
    }

    .button {
      margin-right: 0;
    }
  }
}
</style>
