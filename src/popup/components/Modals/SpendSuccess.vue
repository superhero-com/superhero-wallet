<template>
  <Modal
    class="spend-success"
    has-close-button
    from-bottom
    centered
    @close="resolve"
  >
    <template #header>
      <ModalHeader
        class="header"
        :title="$t('pages.send.title')"
        :subtitle="$t('pages.send.subtitle')"
        disable-subtitle-margin
      />
    </template>

    <div class="pending-wrapper">
      <Pending />
    </div>
    <TokenAmount
      :amount="getTxAmountTotal(transaction)"
      :symbol="getSymbol(transaction)"
      :hide-fiat="!isAe"
    />
    <span class="sending-to">
      {{ transaction.tipUrl ? $t('pages.send.sentTo') : $t('pages.send.sendingTo') }}
    </span>
    <div class="content">
      <span v-if="transaction.tipUrl">{{ transaction.tipUrl }}</span>
      <AvatarWithChainName
        v-else
        :address="transaction.tx.recipientId"
        :show-address="!nameRecipient"
        :hide-avatar="hideAvatar"
        :name="nameRecipient"
      />
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        extend
        nowrap
        has-icon
        :href="getExplorerPath(transaction.hash)"
      >
        <ExternalLink class="external-link" />
        {{ $t('pages.send.viewInExplorer') }}
      </BtnMain>
      <BtnMain
        inline
        nowrap
        @click="resolve"
      >
        {{ $t('ok') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '../Modal.vue';
import TokenAmount from '../TokenAmount.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AvatarWithChainName from '../AvatarWithChainName.vue';
import ModalHeader from '../ModalHeader.vue';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import ExternalLink from '../../../icons/external-link-big.svg?vue-component';
import { AETERNITY_SYMBOL, watchUntilTruthy } from '../../utils';

export default {
  components: {
    ModalHeader,
    AvatarWithChainName,
    Modal,
    Pending,
    TokenAmount,
    BtnMain,
    ExternalLink,
  },
  props: {
    resolve: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  data: () => ({
    hideAvatar: false,
    nameRecipient: null,
  }),
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['getTxAmountTotal', 'getTxSymbol', 'getExplorerPath', 'isTxAex9']),
    ...mapGetters('names', ['getPreferred']),
    isAe() {
      return !(this.transaction.tx.contractId
        && this.availableTokens[this.transaction.tx.contractId]?.symbol);
    },
  },
  async mounted() {
    const { recipientId } = this.transaction.tx;
    await watchUntilTruthy(() => this.$store.state.middleware);
    if (recipientId.includes('nm_')) {
      this.hideAvatar = true;
      this.nameRecipient = (await this.$store.state.middleware.getNameById(recipientId)).name;
    }
  },
  methods: {
    getSymbol() {
      return this.transaction.tx.contractId
        ? this.availableTokens[this.transaction.tx.contractId].symbol
        : AETERNITY_SYMBOL;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.spend-success {
  ::v-deep .container .body {
    @include mixins.flex(flex-start, center, column);
  }

  ::v-deep .token-amount {
    @extend %face-sans-15-medium;

    .symbol {
      margin-left: 4px;
      color: rgba(variables.$color-white, 0.75);
    }

    .fiat {
      font-weight: normal;
    }
  }

  .header {
    margin-top: 40px;
  }

  .avatar-with-chain-name {
    padding-inline: 8px;
  }

  .pending-wrapper {
    @include mixins.flex(center, center, column);

    background-color: variables.$color-bg-1;
    border: 4px solid rgba(variables.$color-white, 0.05);
    border-radius: 50%;
    margin-top: 34px;
    margin-bottom: 24px;
  }

  .animated-pending {
    width: 48px;
    height: 48px;
  }

  .sending-to {
    margin-bottom: 12px;
    color: rgba(variables.$color-white, 0.75);
  }

  .content {
    margin-bottom: 26px;
    width: 100%;
  }
}
</style>
