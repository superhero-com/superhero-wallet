<template>
  <div
    class="account-switcher"
    :class="{ 'notification-above': notification }"
  >
    <div
      :class="['cards-wrapper', { 'menu-under': filteredAccounts.length > 1 }]"
      :style="cssVars"
    >
      <AccountCard
        v-for="account in filteredAccounts"
        :key="account.address"
        :class="{ selected: account.i === accountSelectedIdx }"
        v-bind="account"
        :account-idx="account.i"
      />
    </div>
    <div
      v-if="filteredAccounts.length > 1"
      class="buttons"
    >
      <ButtonPlain
        v-for="(account, idx) in filteredAccounts"
        :key="idx"
        :class="{ selected: account.i === accountSelectedIdx }"
        @click="selectAccount(account.i)"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import AccountCard from './AccountCard';
import ButtonPlain from './ButtonPlain';

export default {
  components: { AccountCard, ButtonPlain },
  props: { notification: Boolean },
  computed: {
    ...mapState(['accountCount', 'accountSelectedIdx']),
    ...mapGetters(['accounts']),
    cssVars() {
      return {
        '--accountSelectedIdx': this.selectedCardNumber,
        '--accountCount': this.filteredAccounts.length,
      };
    },
    filteredAccounts() {
      return this.accounts.map((a, index) => ({ ...a, i: index })).filter((a) => a.showed);
    },
    selectedCardNumber() {
      return this.filteredAccounts.findIndex((a) => a.i === this.accountSelectedIdx);
    },
  },
  methods: {
    async selectAccount(idx) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.$store.commit('selectAccount', idx);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.account-switcher {
  display: flex;
  flex-direction: column;
  border-radius: 0 0 10px 10px;
  padding-top: 12px;

  &.notification-above {
    margin-top: 16px;
  }

  .cards-wrapper {
    display: flex;
    width: calc(var(--accountCount) * (312px + 8px) + 24px + 24px);
    align-self: center;
    margin-bottom: 16px;
    transition: margin-left 0.5s ease-out;
    margin-left: calc(var(--accountSelectedIdx) * (-312px - 8px));

    .account-card {
      margin-right: 4px;

      &:first-of-type {
        margin-left: 16px;
      }

      &:last-of-type {
        margin-right: 16px;
      }
    }

    &.menu-under {
      align-self: flex-start;
      margin-bottom: 12px;
    }
  }

  .buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 12px;

    .button-plain {
      width: 32px;
      height: 13px;
      background: variables.$color-bg-3;
      border: 1px solid variables.$color-border;
      box-sizing: border-box;
      box-shadow: inset 0 0 6px rgb(0 0 0 / 25%);
      border-radius: 8px;
      margin-right: 8px;

      &:hover:not(.selected) {
        border-color: variables.$color-border-hover;
      }

      &:last-of-type {
        margin-right: 0;
      }

      &.selected {
        cursor: default;
        background: radial-gradient(50% 50% at 50% 50%, #00fd9c 0%, rgba(0, 253, 156, 0.8) 100%);
        border: 2px solid rgba(5, 87, 56);
        box-shadow: 0 0 6px rgb(0 253 156 / 44%);
      }
    }
  }
}
</style>
