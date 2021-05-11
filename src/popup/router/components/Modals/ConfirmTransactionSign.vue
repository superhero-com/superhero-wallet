<template>
  <Modal
    full-screen
    class="confirm-transaction-sign"
    data-cy="popup-aex2"
  >
    <TransactionOverview :tx="transaction" />

    <div class="details">
      <DetailsItem :label="$t('pages.signTransaction.fee')">
        <TokenAmount
          slot="value"
          :amount="getTxFee(transaction)"
          hide-fiat
          data-cy="fee"
        />
      </DetailsItem>
      <DetailsItem :label="$t('pages.signTransaction.total')">
        <TokenAmount
          slot="value"
          :amount="getTxAmountTotal(transaction)"
          :symbol="getTxSymbol(transaction)"
          data-cy="total"
        />
      </DetailsItem>
    </div>

    <button
      class="show-advanced"
      :class="{ active: showAdvanced }"
      @click="showAdvanced = !showAdvanced"
    >
      {{ $t('pages.signTransaction.advanced') }}
      <ChevronDown class="icon" />
    </button>

    <div
      v-if="showAdvanced"
      class="advanced"
    >
      <template v-for="field in TX_FIELDS">
        <DetailsItem
          v-if="transaction[field]"
          :key="field"
          :label="$t('modals.confirm-transaction-sign')[field]"
          :value="transaction[field]"
        >
          <CopyButton
            slot="label"
            :value="transaction[field]"
            :message="$t('copied')"
          />
        </DetailsItem>
      </template>
    </div>

    <template slot="footer">
      <Button
        third
        fill="secondary"
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button
        third
        data-cy="accept"
        @click="resolve()"
      >
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import { mapGetters } from 'vuex';
import Modal from '../Modal';
import Button from '../Button';
import TransactionOverview from '../TransactionOverview';
import DetailsItem from '../DetailsItem';
import TokenAmount from '../TokenAmount';
import CopyButton from '../CopyButton';
import ChevronDown from '../../../../icons/chevron-down.svg?vue-component';
import mixin from '../../pages/Popups/mixin';

export default {
  components: {
    Modal,
    Button,
    TransactionOverview,
    DetailsItem,
    TokenAmount,
    CopyButton,
    ChevronDown,
  },
  mixins: [mixin],
  props: {
    transaction: { type: Object, required: true },
  },
  data: () => ({
    showAdvanced: false,
    TX_FIELDS: [
      'nonce',
      'payload',
      'recipientId',
      'code',
      'callData',
      'contractId',
      'commitmentId',
      'name',
      'nameFee',
      'nameSalt',
      'nameId',
      'pointers',
    ],
  }),
  computed: mapGetters(['getTxSymbol', 'getTxAmountTotal', 'getTxFee']),
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';
@import '../../../../styles/typography';

.confirm-transaction-sign {
  .transaction-overview {
    padding: 16px;
  }

  .details {
    display: flex;
    padding: 8px 16px;

    .details-item {
      margin-right: 24px;
    }
  }

  .show-advanced {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 16px 16px 8px;
    background: $color-bg-1;
    width: 100%;

    @extend %face-sans-15-medium;

    color: $color-dark-grey;
    cursor: pointer;

    .icon {
      width: 24px;
      height: 24px;
      color: $color-white;
      opacity: 0.7;
      margin-left: 4px;
    }

    &:hover {
      color: $color-light-grey;

      .icon {
        opacity: 1;
      }
    }

    &.active .icon {
      transform: rotateX(180deg);
    }
  }

  .advanced {
    padding: 8px 16px;
    margin: 0 16px;
    background: $color-bg-2;
  }

  ::v-deep .container {
    background: $color-bg-1;

    .body {
      text-align: left;
    }

    .footer {
      background: $color-bg-1;
    }
  }
}
</style>
