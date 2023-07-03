<template>
  <Modal
    class="spend-success"
    has-close-button
    from-bottom
    centered
    :body-without-padding-bottom="hasPayload"
    data-cy="spend-success"
    @close="resolve"
  >
    <ModalHeader
      class="header"
      :title="$t('pages.send.title')"
      :subtitle="$t('pages.send.subtitle')"
      disable-subtitle-margin
    />
    <div class="pending-wrapper">
      <IconBoxed :icon="PendingIcon" />
    </div>
    <TokenAmount
      :amount="getTxAmountTotal(transaction)"
      :symbol="getSymbol(transaction)"
      :hide-fiat="!isAe"
    />
    <span class="sending-to">
      {{ transaction.tipUrl ? $t('pages.send.sentTo') : $t('pages.send.sendingTo') }}
    </span>
    <div
      class="content"
      :class="{ 'without-margin': hasPayload }"
    >
      <span v-if="transaction.tipUrl">{{ transaction.tipUrl }}</span>
      <AvatarWithChainName
        v-else
        :address="transaction.tx.recipientId"
        :show-address="!nameRecipient"
        :hide-avatar="hideAvatar"
        :name="nameRecipient"
      />
    </div>

    <PayloadDetails
      class="payload-detail"
      :payload="payload"
    />

    <template #footer>
      <BtnMain
        class="btn-secondary"
        variant="muted"
        extend
        nowrap
        extra-padded
        :text="$t('pages.send.viewInExplorer')"
        :href="transactionExplorerUrl"
        :icon="ExternalLink"
      />
      <BtnMain
        inline
        nowrap
        :text="$t('common.ok')"
        @click="resolve"
      />
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { getPayload, AETERNITY_SYMBOL } from '../../utils';
import { AeScan } from '../../../lib/AeScan';
import { useMiddleware } from '../../../composables';
import { useGetter } from '../../../composables/vuex';

import Modal from '../Modal.vue';
import TokenAmount from '../TokenAmount.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AvatarWithChainName from '../AvatarWithChainName.vue';
import ModalHeader from '../ModalHeader.vue';
import PayloadDetails from '../PayloadDetails.vue';

import PendingIcon from '../../../icons/animated-pending.svg?vue-component';
import ExternalLink from '../../../icons/external-link-big.svg?vue-component';
import IconBoxed from '../IconBoxed.vue';

export default {
  components: {
    PayloadDetails,
    ModalHeader,
    AvatarWithChainName,
    Modal,
    TokenAmount,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  setup() {
    const activeNetwork = useGetter('activeNetwork');

    const transactionExplorerUrl = computed(
      () => (new AeScan(activeNetwork.value.explorerUrl)).prepareUrlByHash(props.transaction.hash),
    );

    return {
      PendingIcon,
      ExternalLink,
      transactionExplorerUrl,
    };
  },
  data: () => ({
    hideAvatar: false,
    nameRecipient: null,
  }),
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['getTxAmountTotal', 'getTxSymbol']),
    ...mapGetters('names', ['getPreferred']),
    isAe() {
      return !(this.transaction.tx.contractId
        && this.availableTokens[this.transaction.tx.contractId]?.symbol);
    },
    payload() {
      return getPayload(this.transaction);
    },
    hasPayload() {
      return !!this.payload?.length;
    },
  },
  async mounted() {
    const { getMiddleware } = useMiddleware({ store: this.$store });
    const middleware = await getMiddleware();
    const { recipientId } = this.transaction.tx;
    if (recipientId.includes('nm_')) {
      this.hideAvatar = true;
      this.nameRecipient = (await middleware.getName(recipientId)).name;
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
  :deep(.container .body) {
    @include mixins.flex(flex-start, center, column);
  }

  :deep(.token-amount) {
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
    padding: 0;
  }

  .avatar-with-chain-name {
    padding-inline: 8px;
  }

  .pending-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 34px;
    margin-bottom: 24px;
  }

  .sending-to {
    margin-bottom: 12px;
    color: rgba(variables.$color-white, 0.75);
  }

  .content {
    margin-bottom: 26px;
    width: 100%;

    &.without-margin {
      margin-bottom: 0;
    }
  }

  .payload-detail {
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .btn-secondary {
    width: 119px;
  }
}
</style>
