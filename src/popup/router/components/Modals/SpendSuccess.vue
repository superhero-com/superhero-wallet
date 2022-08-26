<template>
  <Modal
    class="spend-success"
    has-close-button
    from-bottom
    centered
    @close="resolve"
  >
    <ModalHeader
      :title="$t('pages.send.title')"
      :subtitle="$t('pages.send.subtitle')"
    />
    <div class="pending-wrapper">
      <Pending />
    </div>
    <TokenAmount
      :amount="getTxAmountTotal(transaction)"
      :symbol="getSymbol(transaction)"
    />
    <span class="sending-to">
      {{ transaction.tipUrl ? $t('pages.send.sentTo') : $t('pages.send.sendingTo') }}
    </span>
    <span v-if="transaction.tipUrl">{{ transaction.tipUrl }}</span>
    <AvatarWithChainName
      v-else
      :address="transaction.tx.recipientId"
    />
    <div class="button-wrapper">
      <Button
        fill="secondary"
        extend
        nowrap
        has-icon
        :to="getExplorerPath(transaction.hash)"
      >
        <ExternalLink />
        {{ $t('pages.send.viewInExplorer') }}
      </Button>
      <Button
        inline
        nowrap
        @click="resolve"
      >
        {{ $t('ok') }}
      </Button>
    </div>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '../Modal.vue';
import TokenAmount from '../TokenAmount.vue';
import Button from '../Button.vue';
import AvatarWithChainName from '../AvatarWithChainName.vue';
import ModalHeader from '../ModalHeader.vue';
import Pending from '../../../../icons/animated-pending.svg?vue-component';
import ExternalLink from '../../../../icons/external-link.svg?vue-component';

export default {
  components: {
    ModalHeader,
    AvatarWithChainName,
    Modal,
    Pending,
    TokenAmount,
    Button,
    ExternalLink,
  },
  props: {
    resolve: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['getTxAmountTotal', 'getTxSymbol', 'getExplorerPath']),
    ...mapGetters('names', ['getPreferred']),
  },
  methods: {
    getSymbol() {
      return this.transaction.tx.contractId
        ? this.availableTokens[this.transaction.tx.contractId].symbol
        : 'AE';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';
@use '../../../../styles/mixins';

.spend-success {
  ::v-deep .container .body {
    @include mixins.flex(flex-start, center, column);

    padding-inline: 16px;
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

  .avatar-with-chain-name {
    padding-inline: 8px;
  }

  .pending-wrapper {
    @include mixins.flex(center, center, column);

    width: 64px;
    height: 64px;
    background-color: variables.$color-bg-1;
    border: 4px solid rgba(variables.$color-white, 0.05);
    border-radius: 50%;
    margin-top: 26px;
    margin-bottom: 22px;
  }

  .animated-pending {
    width: 48px;
    height: 48px;
  }

  .sending-to {
    margin-bottom: 12px;
    color: rgba(variables.$color-white, 0.75);
  }

  .button-wrapper {
    @include mixins.flex(center, center);

    width: 100%;
    margin-top: 40px;
    gap: 8px;

    .button {
      margin: 0;
    }

    svg {
      width: 30px;
      height: 30px;
      margin-right: 0;
    }
  }
}
</style>
