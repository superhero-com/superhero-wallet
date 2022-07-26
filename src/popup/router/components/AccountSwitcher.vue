<template>
  <div
    class="account-switcher"
    :class="{ 'notification-above': notification }"
  >
    <div
      :class="['cards-wrapper', { 'menu-under': filteredAccounts.length > 1 }]"
      :style="cssVars"
    >
      <div
        v-for="account in filteredAccounts"
        :key="account.address"
      >
        <AddAccountCard
          v-if="account.i === 'add-account'"
          :class="{ selected: account.i === activeAccount }"
        />
        <AccountCard
          v-else
          :class="{ selected: account.i === activeAccount }"
          v-bind="account"
          :account-idx="account.i"
        />
      </div>
    </div>
    <div
      v-if="filteredAccounts.length > 1"
      class="buttons"
    >
      <ButtonPlain
        v-for="(account, idx) in filteredAccounts"
        :key="idx"
        :class="{ selected: account.i === activeAccount }"
        @click="selectAccount(account.i)"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import AccountCard from './AccountCard.vue';
import AddAccountCard from './AddAccountCard.vue';
import ButtonPlain from './ButtonPlain.vue';

export default {
  components: { AccountCard, AddAccountCard, ButtonPlain },
  props: { notification: Boolean },
  data() {
    return {
      activeAccount: 0,
    };
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['accounts']),
    cssVars() {
      return {
        '--activeIdx': this.selectedCardNumber,
        '--nextAccountIdx': this.filteredAccounts.length,
      };
    },
    filteredAccounts() {
      return [
        ...this.accounts.map((a, index) => ({ ...a, i: index })).filter((a) => a.showed),
        { i: 'add-account' },
      ];
    },
    selectedCardNumber() {
      return this.filteredAccounts.findIndex((a) => a.i === this.activeAccount);
    },
  },
  mounted() {
    this.activeAccount = this.activeIdx;
  },
  methods: {
    async selectAccount(idx) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.activeAccount = idx;
      if (idx !== 'add-account') {
        this.$store.commit('accounts/setActiveIdx', idx);
      }
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
  z-index: 1;

  &.notification-above {
    margin-top: 16px;
  }

  .cards-wrapper {
    display: flex;
    width: calc(var(--nextAccountIdx) * (328px + 4px) + 16px + 16px - 4px);
    align-self: center;
    margin-bottom: 16px;
    transition: margin-left 0.5s ease-out;
    margin-left: calc(var(--activeIdx) * (-328px - 4px));

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
