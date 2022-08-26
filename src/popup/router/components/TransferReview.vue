<template>
  <div class="review-wrapper">
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
      v-if="isAddressUrl"
      data-cy="review-tip-url"
      class="tip-url"
      :label="$t('pages.send.receivingUrl')"
      :value="transferData.address"
      new-ui
    />
    <DetailsItem
      v-else
      data-cy="review-recipient"
      new-ui
      :label="$t('pages.send.recipient')"
    >
      <template #value>
        <AvatarWithChainName
          :address="transferData.address"
          :name="isAddressChain ? transferData.address : null"
          :show-address="!isAddressChain"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.tipPage.amountLabel')"
      new-ui
    >
      <template #value>
        <TokenAmount
          :amount="transferData.total"
          :symbol="tokenSymbol"
          :hide-fiat="!!transferData.selectedAsset"
          data-cy="review-total"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.signTransaction.fee')"
      new-ui
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.fee.toFixed()"
          symbol="AE"
          hide-fiat
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>

    <!-- <SendTipButton
      :selected-token="transferData.selectedAsset"
      :tip-url="'erte'"
      :amount="transferData.amount"
    >
      <ArrowSend />
    </SendTipButton> -->

    <Loader v-if="loading" />
  </div>
</template>

<script>
import { SCHEMA } from '@aeternity/aepp-sdk';
import { mapGetters, mapState } from 'vuex';
import {
  aeToAettos,
  checkAensName,
  convertToken,
  escapeSpecialChars,
} from '../../utils/helper';
import { MODAL_DEFAULT } from '../../utils/constants';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import AvatarWithChainName from './AvatarWithChainName.vue';
import ModalHeader from './ModalHeader.vue';

export default {
  name: 'TransferReview',
  components: {
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
    invoiceContract: { type: String, default: null },
    isAddressChain: Boolean,
    isAddressUrl: Boolean,
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters([
      'account',
    ]),
    ...mapState([
      'sdk',
      'tippingV1',
      'tippingV2',
    ]),
    ...mapGetters('fungibleTokens', [
      'tokenBalances',
    ]),
    isRecipientName() {
      return this?.recipientAddress && checkAensName(this.recipientAddress);
    },
    tokenSymbol() {
      return this.transferData.selectedAsset?.symbol || '-';
    },
  },
  methods: {
    async submit() {
      try {
        this.loading = true;

        const {
          amount: amountRaw,
          address: recipient,
          selectedAsset,
          note,
        } = this.transferData;

        if (!amountRaw || !recipient || !selectedAsset) {
          return;
        }

        const amount = (selectedAsset.contractId === 'aeternity')
          ? aeToAettos(amountRaw)
          : convertToken(amountRaw, selectedAsset.decimals);

        if (this.isAddressUrl) {
          this.sendTip({
            amount,
            recipient,
            selectedAsset,
            note,
          });
        } else {
          this.transfer({
            amount,
            recipient,
            selectedAsset,
          });
        }
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: MODAL_DEFAULT,
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async transfer({ amount, recipient, selectedAsset }) {
      console.log('TRANSFER');
      let actionResult;

      if (selectedAsset.invoiceId !== null) {
        actionResult = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
          amount,
          selectedAsset.invoiceContract,
          selectedAsset.invoiceId,
          { waitMined: false, modal: false },
        ]);
      } else {
        actionResult = await this.$store.dispatch('fungibleTokens/transfer', [
          recipient,
          amount,
          { waitMined: false, modal: false },
        ]);
      }

      if (actionResult) {
        await this.$store.dispatch('addPendingTransaction', {
          amount,
          recipient,
          hash: actionResult.hash,
          type: 'spendToken',
          pendingTokenTx: true,
          tx: {
            callerId: this.account.address,
            contractId: selectedAsset.contractId,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'transfer',
          },
        });

        this.$emit('success');
      }
    },
    async sendTip({
      amount,
      recipient,
      selectedAsset,
      note,
    }) {
      console.log('TIP');
      await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', amount);

      const txResult = await this.tippingV2.methods.tip_token(
        recipient,
        escapeSpecialChars(note),
        selectedAsset.contractId,
        convertToken(amount, selectedAsset.decimals).toFixed(),
      );

      await this.$store.dispatch('fungibleTokens/loadTokenBalances');

      this.$store.commit(
        'fungibleTokens/setSelectedToken',
        this.tokenBalances.find(({ value }) => value === selectedAsset.value),
      );

      await this.$store.dispatch('addPendingTransaction', {
        amount,
        hash: txResult.hash,
        tipUrl: recipient,
        tx: {
          callerId: this.account.address,
          contractId: this.tippingV2.deployInfo.address,
          type: SCHEMA.TX_TYPE.contractCall,
          function: 'tip',
        },
      });

      this.$emit('success');
    },
  },
};
</script>
