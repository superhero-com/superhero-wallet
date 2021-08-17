<template>
  <div class="accounts">
    <Plate class="header">
      <AccountCard
        :account-idx="0"
        v-bind="accounts[0]"
      />
    </Plate>
    <div
      v-for="(account, idx) in accounts.slice(1)"
      :key="idx + 1"
      class="card-wrapper"
    >
      <AccountCard
        :account-idx="idx + 1"
        v-bind="account"
      />
      <CheckBox
        :value="account.showed"
        @input="toggleAccountShowed(account.showed, idx + 1)"
      >
        {{ $t('pages.accounts.showWallet') }}
      </CheckBox>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import AccountCard from '../components/AccountCard';
import Plate from '../components/Plate';
import CheckBox from '../components/CheckBox';

export default {
  components: { AccountCard, Plate, CheckBox },
  computed: mapGetters(['accounts']),
  methods: {
    async toggleAccountShowed(isShowed, index) {
      if (!isShowed && this.$store.state.accs.reduce((a, b) => (b.showed ? a + 1 : a), 0) === 8) {
        await this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.switcherAccsLimit.title'),
          msg: this.$t('modals.switcherAccsLimit.msg'),
        });
      } else {
        this.$store.commit('toggleAccountShowed', index);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.accounts {
  min-height: 600px;
  padding-bottom: 16px;

  .header {
    display: flex;
    justify-content: center;
    padding-top: 12px;
    padding-bottom: 16px;
  }

  .card-wrapper {
    .account-card {
      margin: 16px auto;
    }

    .checkbox-container {
      padding: 0 0 8px 26px;
    }
  }
}
</style>
