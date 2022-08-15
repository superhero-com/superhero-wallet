<template>
  <Modal
    class="spend-success"
    has-close-button
    @close="resolve"
  >
    <Pending />
    <div>
      <TokenAmount
        :amount="getTxAmountTotal(transaction)"
        :symbol="getSymbol(transaction)"
        hide-fiat
      />
      {{ $t('pages.send.successAlert') }}
    </div>
    <span class="name">{{ getPreferred(transaction.tx.recipientId) || '' }}</span>
    <span>{{ transaction.tx.recipientId }}</span>
    <Button
      slot="footer"
      @click="resolve"
    >
      {{ $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '../Modal.vue';
import Pending from '../../../../icons/animated-pending.svg?vue-component';
import TokenAmount from '../TokenAmount.vue';
import Button from '../Button.vue';

export default {
  components: {
    Modal, Pending, TokenAmount, Button,
  },
  props: {
    resolve: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['getTxAmountTotal', 'getTxSymbol']),
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

.spend-success ::v-deep .container .body {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: variables.$color-light-grey;

  @extend %face-sans-15-regular;

  .name,
  svg {
    color: white;
  }

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
  }
}
</style>
