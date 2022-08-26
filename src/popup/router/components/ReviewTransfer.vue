<template>
  <div class="review-wrapper">
    <div class="review">
      <ModalHeader
        :title="$t('pages.send.reviewtx')"
        :subtitle="$t('pages.send.checkalert')"
      />
      <DetailsItem
        :label="$t('pages.send.sender')"
        data-cy="review-sender"
        new-ui
      >
        <template #value>
          <AvatarWithChainName
            :address="account.address"
            :name="account.name"
            :show-address="!isRecipientName"
          />
        </template>
      </DetailsItem>
      <DetailsItem
        v-if="recipientAddress && !tipUrl"
        :label="$t('pages.send.recipient')"
        data-cy="review-recipient"
        new-ui
      >
        <template #value>
          <AvatarWithChainName
            :address="recipientAddress"
            :name="isRecipientName ? recipientAddress : ''"
            :show-address="!isRecipientName"
          />
        </template>
      </DetailsItem>
      <DetailsItem
        v-if="tipUrl"
        :label="$t('pages.send.receivingUrl')"
        data-cy="review-tip-url"
        :value="tipUrl"
        class="tip-url"
        new-ui
      />
      <DetailsItem
        :label="$t('pages.signTransaction.fee')"
        new-ui
      >
        <TokenAmount
          slot="value"
          :amount="+fee.toFixed()"
          symbol="AE"
          hide-fiat
          data-cy="review-fee"
        />
      </DetailsItem>
      <DetailsItem
        :label="$t('pages.signTransaction.total')"
        new-ui
      >
        <TokenAmount
          slot="value"
          :amount="total"
          :symbol="tokenSymbol"
          :hide-fiat="!!selectedToken"
          data-cy="review-total"
        />
      </DetailsItem>
    </div>
    <ReviewFooterWrapper>
      <Button
        data-cy="reivew-editTxDetails-button"
        fill="secondary"
        inline
        nowrap
        @click="handleEdit"
      >
        {{ $t('pages.send.editTxDetails') }}
      </Button>
      <Button
        v-if="!tipUrl"
        data-cy="review-send-button"
        :disabled="!sdk"
        extend
        new-ui
        @click="send"
      >
        <ArrowSend />
        {{ $t('pages.send.send') }}
      </Button>
      <SendTipButton
        v-else
        :selected-token="selectedToken"
        :tip-url="tipUrl"
        :amount="amount"
      >
        <ArrowSend />
      </SendTipButton>
    </ReviewFooterWrapper>
    <!--    TODO - pawel - move loading to parent -->
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { SCHEMA } from '@aeternity/aepp-sdk';
import { mapGetters, mapState } from 'vuex';
import { aeToAettos, checkAensName, convertToken } from '../../utils/helper';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import AvatarWithChainName from './AvatarWithChainName.vue';
import Button from './Button.vue';
import ArrowSend from '../../../icons/arrow-send.svg?vue-component';
import ModalHeader from './ModalHeader.vue';
import SendTipButton from './SendTipButton.vue';
import ReviewFooterWrapper from './ReviewFooterWrapper.vue';

export default {
  components: {
    ReviewFooterWrapper,
    ModalHeader,
    Button,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
    SendTipButton,
    ArrowSend,
  },
  props: {
    amount: { type: String, required: true },
    recipientAddress: { type: String },
    total: { type: Number, required: true },
    selectedToken: { type: Object, default: null },
    tipUrl: { type: String, default: null },
    fee: { type: Object, default: null },
    invoiceId: { type: String, default: null },
    invoiceContract: { type: String, default: null },
    tokenSymbol: { type: String, required: true },
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState(['sdk']),
    isRecipientName() {
      return this?.recipientAddress && checkAensName(this.recipientAddress);
    },
  },
  methods: {
    handleEdit() {
      this.$emit('edit');
    },
    handleClose() {
      this.$emit('close');
    },
    async send() {
      const amount = !this.selectedToken
        ? aeToAettos(this.amount)
        : convertToken(this.amount, this.selectedToken.decimals);
      const receiver = this.recipientAddress;
      this.loading = true;
      try {
        if (this.selectedToken && this.invoiceId !== null) {
          const { hash } = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
            this.amount,
            this.invoiceContract,
            this.invoiceId,
            { waitMined: false, modal: false },
          ]);
          this.$store.dispatch('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipient: receiver,
            pendingTokenTx: true,
            tx: {
              callerId: this.account.address,
              contractId: this.selectedToken.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
              function: 'transfer',
            },
          });
        } else if (this.selectedToken) {
          const { hash } = await this.$store.dispatch('fungibleTokens/transfer', [
            receiver,
            this.amount,
            { waitMined: false, modal: false },
          ]);
          this.$store.dispatch('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipient: receiver,
            pendingTokenTx: true,
            tx: {
              callerId: this.account.address,
              contractId: this.selectedToken.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
              function: 'transfer',
            },
          });
        } else {
          const { hash } = await this.sdk.spend(amount, receiver, {
            waitMined: false,
            modal: false,
          });
          this.$store.dispatch('addPendingTransaction', {
            hash,
            amount,
            type: 'spend',
            tx: {
              senderId: this.account.address,
              recipientId: this.recipientAddress,
              type: SCHEMA.TX_TYPE.spend,
            },
          });
        }
        this.handleClose();
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';
@use '../../../styles/mixins';
@use '../../../styles/variables';

.review-wrapper {
  .review {
    @include mixins.flex(flex-start, flex-start, column);

    margin-bottom: variables.$modal-footer-height;

    .tip-url {
      ::v-deep .value {
        @extend %face-sans-14-regular;

        line-height: 24px;
      }
    }
  }

  .arrow-send {
    height: 20px;
    width: 20px;
  }
}
</style>
