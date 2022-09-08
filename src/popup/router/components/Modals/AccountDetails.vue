<template>
  <Modal
    class="account-details"
    from-bottom
    has-close-button
    full-screen
    @close="resolve"
  >
    <template #header>
      <div class="account-info-wrapper">
        <AccountInfo
          :account-idx="accountIdx"
          can-copy-address
        />
      </div>
    </template>

    <div ref="accountDetails">
      <BalanceInfo :account-idx="accountIdx" />
      <div class="buttons">
        <ButtonPlain @click="openTransferReceiveModal">
          <div class="icon">
            <ArrowReceive />
          </div>
          <div>{{ $t('pages.token-details.receive') }}</div>
        </ButtonPlain>
        <ButtonPlain>
          <div class="icon">
            <ArrowSend />
          </div>
          <div>{{ $t('pages.token-details.send') }}</div>
        </ButtonPlain>
        <ButtonPlain>
          <div class="icon">
            <CreditCard />
          </div>
          <div>{{ $t('pages.token-details.buy') }}</div>
        </ButtonPlain>
        <ButtonPlain>
          <div class="icon">
            <Swap />
          </div>
          <div>{{ $t('pages.token-details.swap') }}</div>
        </ButtonPlain>
      </div>
      <div class="tabs-wrapper">
        <div class="tabs">
          <ButtonPlain
            v-for="tab of tabs"
            :key="tab"
            :class="{active: activeTab === tab}"
            @click.prevent="activeTab = tab"
          >
            {{ $t(`modals.account-details.${tab}`) }}
          </ButtonPlain>
        </div>
      </div>
      <div
        v-if="showSearchBox || searchTerm.length"
        class="search-bar-wrapper"
      >
        <SearchBar
          v-model="searchTerm"
          new-ui
          :placeholder="searchTermPlaceholder"
        />
      </div>
      <div class="tabs-content">
        <div
          v-if="activeTab === 'tokens'"
          class="token-list-wrapper"
        >
          <TokensList
            :search-term="searchTerm"
          />
        </div>
        <div
          v-if="activeTab === 'transactions'"
          class="transaction-list-wrapper"
        >
          <TransactionList
            ref="transaction_list"
            :search-term="searchTerm"
            :display-filter="showSearchBox"
          />
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import { MODAL_TRANSFER_RECEIVE } from '../../../utils/constants';
import Modal from '../Modal.vue';
import AccountInfo from '../AccountInfo.vue';
import BalanceInfo from '../BalanceInfo.vue';
import ButtonPlain from '../ButtonPlain.vue';
import SearchBar from '../SearchBar.vue';
import TransactionList from '../TransactionList.vue';
import TokensList from '../FungibleTokens/TokensList.vue';
import ArrowReceive from '../../../../icons/arrow-receive.svg?vue-component';
import ArrowSend from '../../../../icons/arrow-send.svg?vue-component';
import CreditCard from '../../../../icons/credit-card.svg?vue-component';
import Swap from '../../../../icons/swap.svg?vue-component';

export default {
  components: {
    Modal,
    AccountInfo,
    BalanceInfo,
    ButtonPlain,
    SearchBar,
    TransactionList,
    TokensList,
    ArrowReceive,
    ArrowSend,
    CreditCard,
    Swap,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    accountIdx: { type: Number, required: true },
  },
  data() {
    return {
      activeTab: 'tokens',
      tabs: ['tokens', 'transactions', 'names'],
      searchTerm: '',
      showSearchBox: false,
    };
  },
  computed: {
    searchTermPlaceholder() {
      if (this.activeTab === 'tokens') {
        return this.$t('pages.fungible-tokens.searchPlaceholder');
      }

      if (this.activeTab === 'transactions') {
        return this.$t('pages.recentTransactions.searchPlaceholder');
      }

      return null;
    },
  },
  mounted() {
    if (this.$refs.accountDetails) {
      this.accountDetailsContainer = this.$refs.accountDetails.parentElement.parentElement;
      this.accountDetailsContainer.addEventListener('scroll', () => {
        this.showSearchBox = this.accountDetailsContainer.scrollTop > 152;
      });
    }

    this.$watch('$route', this.resolve);
  },
  beforeDestroy() {
    if (this.accountDetailsContainer) {
      this.accountDetailsContainer.removeEventListener('scroll', () => {
        this.showSearchBox = false;
      });
    }
  },
  methods: {
    openTransferReceiveModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/mixins';
@use '../../../../styles/typography';

.account-details {
  font-weight: 500;
  color: variables.$color-white;

  ::v-deep .container {
    .body {
      padding: 0;
    }
  }

  ::v-deep .account-info .container,
  ::v-deep .tokens-list .container {
    width: auto;
    height: auto;
    overflow: auto;
  }

  .account-info-wrapper {
    padding: 8px 6px 6px;
    position: sticky;
    top: env(safe-area-inset-top);
    z-index: 1;
    background-color: variables.$color-bg-4;

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
      word-break: normal;

      @extend %face-sans-16-regular;
    }
  }

  .buttons {
    padding: 20px 6px 12px;
    width: 100%;
    display: inline-flex;
    justify-content: space-between;

    .button-plain {
      width: 75px;
      height: 58px;
      background-color: rgba(variables.$color-white, 0.08);
      border-radius: 10px;
      color: rgba(variables.$color-white, 1);
      text-decoration: none;

      @extend %face-sans-14-regular;

      @include mixins.flex(center, center, column);

      .icon {
        opacity: 0.85;
        margin-bottom: -5px;

        svg {
          color: rgba(variables.$color-white, 1);
          width: 24px;
          height: 24px;
        }
      }

      &:hover {
        background-color: rgba(variables.$color-white, 0.15);

        .icon {
          opacity: 1;
        }
      }
    }
  }

  .tabs-wrapper {
    background-color: variables.$color-bg-4;
    position: sticky;
    top: calc(env(safe-area-inset-top) + 60px);
    padding: 4px 6px 0;
    z-index: 1;

    .tabs {
      background-color: variables.$color-bg-3;
      padding: 4px;
      border-radius: 12px;
      gap: 16px;

      @include mixins.flex(flex-start, center, row);

      .button-plain {
        padding: 4px 10px;
        gap: 4px;
        border-radius: 10px;

        @extend %face-sans-14-medium;

        @include mixins.flex(center, center, row);

        &.active {
          background-color: rgba(variables.$color-white, 0.15);
          color: variables.$color-white;
        }
      }
    }
  }

  .search-bar-wrapper {
    position: sticky;
    top: calc(env(safe-area-inset-top) + 104px);
    padding: 8px 6px 6px;
    z-index: 1;
    background-color: variables.$color-bg-4;
  }

  .tabs-content {
    padding: 6px 0;

    .token-list-wrapper {
      position: relative;
      padding-top: 4px;

      ::v-deep .tokens-list-item {
        padding: 6px;
        background-color: variables.$color-bg-4;

        &:hover {
          background-color: variables.$color-bg-4-hover;
        }

        &:active {
          opacity: 0.5;
        }
      }
    }

    .transaction-list-wrapper {
      ::v-deep .filters {
        top: calc(env(safe-area-inset-top) + 154px);
        background-color: variables.$color-bg-4;
      }

      ::v-deep .message {
        height: 500px;
      }

      ::v-deep .transaction-item {
        background-color: variables.$color-bg-4;

        &:hover {
          background-color: variables.$color-bg-4-hover;
        }

        .body .footer {
          word-break: normal;
        }
      }
    }
  }
}
</style>
