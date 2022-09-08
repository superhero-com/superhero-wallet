<template>
  <div class="account-details">
    <div class="account-info-wrapper">
      <AccountInfo
        :account-idx="activeIdx"
        show-copy-icon
      />

      <ButtonIcon
        class="close-button"
        :to="{ name: 'index' }"
      >
        <CloseIcon />
      </ButtonIcon>
    </div>

    <BalanceInfo :account-idx="activeIdx" />

    <div class="buttons">
      <BoxButton
        v-for="(action, index) in actions"
        :key="index"
        new-ui
        @click="action.onClick"
      >
        <Component :is="action.icon" />
        <div>{{ action.text }}</div>
      </BoxButton>
    </div>

    <div class="header">
      <div class="tabs">
        <ButtonPlain
          v-for="tab in tabs"
          :key="tab.routeName"
          :exact-path="tab.exact"
          :to="{ name: tab.routeName }"
          :text="tab.text"
        />
      </div>

      <div class="search-bar-wrapper">
        <SearchBar
          v-if="searchTermPlaceholder"
          v-model="searchTerm"
          :placeholder="searchTermPlaceholder"
        />
      </div>
    </div>

    <div class="tabs-content">
      <transition
        name="fade-transition"
        mode="out-in"
      >
        <RouterView :search-term="searchTerm" />
      </transition>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  DEX_URL,
  SIMPLEX_URL,
} from '../../utils/constants';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import ButtonPlain from '../components/ButtonPlain.vue';
import BoxButton from '../components/BoxButton.vue';
import SearchBar from '../components/SearchBar.vue';
import ButtonIcon from '../components/ButtonIcon.vue';
import ArrowReceiveIcon from '../../../icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../../icons/arrow-send.svg?vue-component';
import CreditCardIcon from '../../../icons/credit-card.svg?vue-component';
import SwapIcon from '../../../icons/swap.svg?vue-component';
import CloseIcon from '../../../icons/close.svg?vue-component';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    ButtonPlain,
    ButtonIcon,
    BoxButton,
    SearchBar,
    CloseIcon,
  },
  data() {
    return {
      actions: [
        {
          text: this.$t('pages.token-details.receive'),
          onClick: () => this.$store.dispatch('modals/open', {
            name: MODAL_TRANSFER_RECEIVE,
          }),
          icon: ArrowReceiveIcon,
        },
        {
          text: this.$t('pages.token-details.send'),
          onClick: () => this.$store.dispatch('modals/open', {
            name: MODAL_TRANSFER_SEND,
          }),
          icon: ArrowSendIcon,
        },
        {
          text: this.$t('pages.token-details.buy'),
          onClick: () => window.open(SIMPLEX_URL, '_blank'),
          icon: CreditCardIcon,
        },
        {
          text: this.$t('pages.token-details.swap'),
          onClick: () => window.open(DEX_URL, '_blank'),
          icon: SwapIcon,
        },
      ],
      tabs: [
        {
          text: this.$t('modals.account-details.tokens'),
          routeName: 'account-details',
          exact: true,
        },
        {
          text: this.$t('modals.account-details.transactions'),
          routeName: 'account-details-transactions',
        },
        {
          text: this.$t('modals.account-details.names'),
          routeName: 'account-details-names',
        },
      ],
      searchTerm: '',
    };
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    searchTermPlaceholder() {
      switch (this.$route.name) {
        case 'account-details':
          return this.$t('pages.fungible-tokens.searchPlaceholder');
        case 'account-details-transactions':
          return this.$t('pages.recentTransactions.searchPlaceholder');
        default:
          return null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';
@use '../../../styles/typography';

.account-details {
  --screen-padding-x: 12px;

  .account-info-wrapper {
    position: sticky;
    top: env(safe-area-inset-top);
    z-index: 2;
    display: flex;
    justify-content: space-between;
    padding: 8px 6px 6px;
    background-color: var(--screen-bg-color);

    .button-plain {
      width: 24px;
      height: 24px;
      position: absolute;
      right: 7px;
      top: 7px;
      color: variables.$color-white;

      svg {
        width: 24px;
      }
    }

    ::v-deep .account-info .title {
      justify-content: flex-start;
      word-break: normal;

      @extend %face-sans-16-regular;
    }
  }

  .balance-info {
    padding-top: calc(8px + env(safe-area-inset-top));
  }

  .buttons {
    padding: 20px var(--screen-padding-x) 12px;
    width: 100%;
    display: inline-flex;
    justify-content: space-between;
    gap: 16px;
  }

  .header {
    position: sticky;
    z-index: 2;
    top: calc(env(safe-area-inset-top) + 62px);
    padding: 8px var(--screen-padding-x);
    background-color: variables.$modal-bg-color;
  }

  .tabs {
    gap: 16px;
    padding: 4px;
    border-radius: 14px;
    background-color: variables.$color-bg-3;

    @include mixins.flex(flex-start, center, row);

    .button-plain {
      padding: 4px 10px;
      gap: 4px;
      border-radius: 10px;

      @extend %face-sans-14-medium;

      @include mixins.flex(center, center, row);

      &.router-link-active {
        background-color: rgba(variables.$color-white, 0.15);
        color: variables.$color-white;
      }
    }
  }

  .search-bar-wrapper {
    position: sticky;
    top: calc(env(safe-area-inset-top) + 104px);
    z-index: 1;
    margin-top: 8px;
    background-color: variables.$modal-bg-color;
  }

  .tabs-content {
    position: relative;
    padding: 0 var(--screen-padding-x);
  }
}
</style>
