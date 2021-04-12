<template>
  <div class="accounts">
    <div class="temp">
      <AccountCard
        :account-idx="0"
        v-bind="accounts[0]"
      />
    </div>
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
import CheckBox from '../components/CheckBox';

export default {
  components: { AccountCard, CheckBox },
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
@import '../../../styles/variables';

.accounts {
  min-height: 600px;
  background-color: $color-bg-3;
  padding-bottom: 16px;

  .temp {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    padding-bottom: 24px;
    border-bottom: 0.5px solid $color-border;
    border-radius: 0 0 10px 10px;
    background: linear-gradient(180deg, $color-bg-3 0%, $color-black 100%);
  }

  .card-wrapper {
    .account-card {
      margin: 24px auto 16px auto;
    }

    .checkbox-container {
      padding: 0 0 8px 32px;
    }
  }
}
</style>
