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
          :amount="+transferData.amount"
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
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>
    <DetailsItem
      v-if="transferData.selectedAsset.contractId === 'aeternity'"
      :label="$t('pages.signTransaction.total')"
      new-ui
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.total"
          symbol="AE"
          hide-fiat
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { SCHEMA } from '@aeternity/aepp-sdk';
import { mapGetters, mapState } from 'vuex';
import deeplinkApi from '../../../mixins/deeplinkApi';
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
  mixins: [deeplinkApi],
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
    isAddressChain: Boolean,
    isAddressUrl: Boolean,
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState([
      'sdk',
      'tippingV1',
      'tippingV2',
    ]),
    isRecipientName() {
      return this?.recipientAddress && checkAensName(this.recipientAddress);
    },
    tokenSymbol() {
      return this.transferData.selectedAsset?.symbol || '-';
    },
    tippingContract() {
      return this.tippingV2 || this.tippingV1;
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
      let actionResult;

      if (this.transferData.invoiceId != null) {
        actionResult = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
          selectedAsset.contractId,
          amount,
          this.transferData.invoiceContract,
          this.transferData.invoiceId,
          { waitMined: false, modal: false },
        ]);
      } else if (selectedAsset.contractId !== 'aeternity') {
        actionResult = await this.$store.dispatch('fungibleTokens/transfer', [
          selectedAsset.contractId,
          recipient,
          amount,
          { waitMined: false, modal: false },
        ]);
      } else {
        actionResult = await this.sdk.spend(amount, recipient, {
          waitMined: false,
          modal: false,
        });
      }

      if (actionResult && selectedAsset.contractId !== 'aeternity') {
        this.$store.dispatch('addPendingTransaction', {
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
      } else if (actionResult) {
        this.$store.dispatch('addPendingTransaction', {
          hash: actionResult.hash,
          amount,
          type: 'spend',
          tx: {
            senderId: this.account.address,
            recipientId: recipient,
            type: SCHEMA.TX_TYPE.spend,
          },
        });
      }
      this.$emit('success');
    },
    async sendTip({
      amount,
      recipient,
      selectedAsset,
      note,
    }) {
      this.loading = true;
      try {
        let txResult = null;
        if (selectedAsset.contractId !== 'aeternity') {
          await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', [selectedAsset.contractId, this.amount]);
          txResult = await this.tippingV2.methods.tip_token(
            recipient,
            escapeSpecialChars(note),
            selectedAsset.contractId,
            amount,
          );
        } else {
          txResult = await this.tippingContract.call(
            'tip',
            [recipient, escapeSpecialChars(note)],
            {
              amount,
              waitMined: false,
              modal: false,
            },
          );
        }
        this.$store.dispatch('addPendingTransaction', {
          hash: txResult.hash,
          amount,
          tipUrl: recipient,
          tx: {
            callerId: this.account.address,
            contractId: this.tippingContract.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'tip',
          },
        });
        this.openCallbackOrGoHome(true);
      } catch (e) {
        this.openCallbackOrGoHome(false);
        await this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = { url: recipient };
        throw e;
      } finally {
        this.loading = false;
      }

      this.$emit('success');
    },
  },
};
</script>
