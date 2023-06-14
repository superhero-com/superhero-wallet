<template>
  <div class="transfer-review">
    <ModalHeader
      :title="isMultisig ? $t('modals.multisigTxProposal.title') : $t('pages.send.reviewtx')"
      :subtitle="isMultisig ? null : $t('pages.send.checkalert')"
    />

    <div
      v-if="isMultisig"
      class="multisig-account"
    >
      <AccountItem :address="activeMultisigAccount.gaAccountId" />
    </div>

    <DetailsItem
      :label="isMultisig ? $t('modals.multisigTxProposal.signingAddress') : $t('pages.send.sender')"
      data-cy="review-sender"
    >
      <template #value>
        <AvatarWithChainName
          :address="activeAccount.address"
          :name="activeAccount.name"
          :show-address="!isRecipientName"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      v-if="isAddressUrl"
      data-cy="review-tip-url"
      class="tip-url details-item"
      :label="$t('pages.send.receivingUrl')"
      :value="transferData.address"
    />
    <DetailsItem
      v-else
      class="details-item"
      data-cy="review-recipient"
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
      :label="
        (isMultisig)
          ? $t('modals.multisigTxProposal.amountProposed')
          : $t('common.amount')
      "
      class="details-item"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.amount"
          :symbol="tokenSymbol"
          :hide-fiat="isSelectedAssetAex9"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      v-if="isMultisig"
      class="details-item"
      :label="$t('modals.multisigTxProposal.fee')"
    >
      <template #value>
        <!-- TODO provide correct fee for the multisig -->
        <TokenAmount
          :amount="PROPOSE_TRANSACTION_FEE"
          :symbol="AETERNITY_SYMBOL"
          hide-fiat
          high-precision
          data-cy="multisig-review-fee"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      class="details-item"
      :label="$t('transaction.fee')"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.fee.toFixed()"
          :symbol="AETERNITY_SYMBOL"
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      v-if="transferData.selectedAsset.contractId === AETERNITY_CONTRACT_ID"
      :label="$t('common.total')"
      class="details-item"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.total"
          :symbol="AETERNITY_SYMBOL"
          high-precision
          data-cy="review-total"
        />
      </template>
    </DetailsItem>

    <PayloadDetails
      class="details-item"
      :payload="transferData.payload"
    />

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { encode, Encoding } from '@aeternity/aepp-sdk-13';
import {
  useAccounts,
  useDeepLinkApi,
  useModals,
  useMultisigAccounts,
  useMultisigTransactions,
  useSdk13,
  useTippingContracts,
} from '../../composables';
import {
  AETERNITY_CONTRACT_ID,
  AETERNITY_SYMBOL,
  TX_FUNCTIONS,
  aeToAettos,
  checkAensName,
  convertToken,
  escapeSpecialChars,
  handleUnknownError,
} from '../utils';
import { ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS } from '../router/routeNames';
import { IPendingTransaction } from '../../types';
import { TransferFormModel } from './Modals/TransferSend.vue';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import AvatarWithChainName from './AvatarWithChainName.vue';
import ModalHeader from './ModalHeader.vue';
import PayloadDetails from './PayloadDetails.vue';
import AccountItem from './AccountItem.vue';

export default defineComponent({
  name: 'TransferReview',
  components: {
    AccountItem,
    PayloadDetails,
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    isAddressChain: Boolean,
    isAddressUrl: Boolean,
    isMultisig: Boolean,
    recipientAddress: { type: String, default: null },
    amount: { type: Number, default: null },
  },
  setup(props, { root, emit }) {
    const { openDefaultModal } = useModals();
    const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });
    const { activeAccount } = useAccounts({ store: root.$store });
    const {
      activeMultisigAccount,
      addTransactionToPendingMultisigAccount,
      updateMultisigAccounts,
    } = useMultisigAccounts({ store: root.$store });
    const { getTippingContracts } = useTippingContracts({ store: root.$store });

    const loading = ref<boolean>(false);
    const { getSdk } = useSdk13({ store: root.$store });
    const isRecipientName = computed(
      () => props.recipientAddress && checkAensName(props.recipientAddress),
    );
    const tokenSymbol = computed(() => props.transferData.selectedAsset?.symbol || '-');
    const isSelectedAssetAex9 = computed(() => (
      !!props.transferData.selectedAsset
      && props.transferData.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
    ));

    // TODO provide correct fee for the multisig
    const PROPOSE_TRANSACTION_FEE = 0.000182940;

    function openTransactionFailedModal() {
      openDefaultModal({
        title: root.$t('modals.transaction-failed.msg'),
        icon: 'critical',
      });
    }

    async function transfer({ amount, recipient, selectedAsset }: any) {
      const sdk = await getSdk();
      loading.value = true;
      try {
        let actionResult;

        if (props.transferData.invoiceId !== null) {
          actionResult = await root.$store.dispatch('fungibleTokens/burnTriggerPoS', [
            selectedAsset.contractId,
            amount,
            props.transferData.invoiceContract,
            props.transferData.invoiceId,
            { waitMined: false, modal: false },
          ]);
        } else if (selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          actionResult = await root.$store.dispatch('fungibleTokens/transfer', [
            selectedAsset.contractId,
            recipient,
            amount,
            { waitMined: false, modal: false },
          ]);
        } else {
          actionResult = await sdk.spendWithCustomOptions(amount, recipient, {
            payload: encode(Buffer.from(props.transferData.payload), Encoding.Bytearray),
            modal: false,
          });
        }

        if (actionResult && selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          const transaction: IPendingTransaction = {
            recipient,
            hash: actionResult.hash,
            pendingTokenTx: true,
            pending: true,
            type: 'spendToken',
            tx: {
              amount,
              callerId: activeAccount.value.address,
              contractId: selectedAsset.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
              function: TX_FUNCTIONS.transfer,
              recipientId: recipient,
            },
          };

          root.$store.dispatch('addPendingTransaction', transaction);
        } else if (actionResult) {
          const transaction: IPendingTransaction = {
            hash: actionResult.hash,
            pending: true,
            type: 'spend',
            tx: {
              amount,
              senderId: activeAccount.value.address,
              recipientId: recipient,
              type: SCHEMA.TX_TYPE.spend,
            },
          };

          root.$store.dispatch('addPendingTransaction', transaction);
        }
        emit('success');
      } catch (error) {
        openTransactionFailedModal();
        throw error;
      } finally {
        loading.value = false;
      }
    }

    async function sendTip({
      amount,
      recipient,
      selectedAsset,
      note,
    }: any) {
      loading.value = true;
      try {
        let txResult = null;
        const { tippingV1, tippingV2 } = await getTippingContracts();
        const tippingContract = tippingV2 || tippingV1;
        if (selectedAsset.contractId !== AETERNITY_CONTRACT_ID && tippingV2) {
          await root.$store.dispatch('fungibleTokens/createOrChangeAllowance', [
            selectedAsset.contractId,
            props.amount,
          ]);
          txResult = await tippingV2.tip_token(
            recipient,
            escapeSpecialChars(note),
            selectedAsset.contractId,
            amount,
          );
        } else {
          txResult = await tippingContract.tip(
            recipient,
            escapeSpecialChars(note),
            {
              amount,
              waitMined: false,
              ...{ modal: false } as any, // TODO: `modal` is not a part of sdk types
            },
          );
        }
        const transaction: IPendingTransaction = {
          hash: txResult.hash,
          pending: true,
          tipUrl: recipient,
          tx: {
            amount,
            callerId: activeAccount.value.address,
            contractId: tippingContract.$options.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'tip',
            selectedTokenContractId: selectedAsset.contractId,
          },
        };
        root.$store.dispatch('addPendingTransaction', transaction);
        openCallbackOrGoHome(true);
        emit('success');
      } catch (error: any) {
        openCallbackOrGoHome(false);
        openTransactionFailedModal();
        error.payload = { url: recipient };
        throw error;
      } finally {
        loading.value = false;
      }
    }

    async function proposeMultisigTransaction() {
      loading.value = true;
      try {
        const {
          buildSpendTx, proposeTx, postSpendTx,
        } = useMultisigTransactions({ store: root.$store });
        if (activeMultisigAccount.value) {
          const txToPropose = await buildSpendTx(
            activeMultisigAccount.value.gaAccountId,
            props.transferData.address!,
            aeToAettos(props.transferData.amount!),
            props.transferData.payload || '',
          );

          const txHash = await proposeTx(txToPropose, activeMultisigAccount.value.contractId);

          if (activeMultisigAccount.value.pending) {
            addTransactionToPendingMultisigAccount(
              txHash,
              activeMultisigAccount.value.gaAccountId,
              activeAccount.value.address,
            );
          }

          await postSpendTx(txToPropose, txHash);
          await updateMultisigAccounts();
          root.$router.push({ name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS });
        }
      } catch (error) {
        handleUnknownError(error);
      } finally {
        emit('success');
        loading.value = true;
      }
    }

    function submit(): any {
      const {
        amount: amountRaw,
        address: recipient,
        selectedAsset,
        note,
      } = props.transferData;

      if (!amountRaw || !recipient || !selectedAsset) {
        return null;
      }

      const amount = (selectedAsset.contractId === AETERNITY_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : convertToken(amountRaw, selectedAsset.decimals);

      if (props.isMultisig) {
        return proposeMultisigTransaction();
      }
      if (props.isAddressUrl) {
        return sendTip({
          amount,
          recipient,
          selectedAsset,
          note,
        });
      }
      return transfer({
        amount,
        recipient,
        selectedAsset,
      });
    }

    return {
      AETERNITY_SYMBOL,
      AETERNITY_CONTRACT_ID,
      PROPOSE_TRANSACTION_FEE,
      loading,
      submit,
      isRecipientName,
      isSelectedAssetAex9,
      tokenSymbol,
      activeAccount,
      activeMultisigAccount,
    };
  },
});
</script>

<style scoped lang="scss">
.transfer-review {
  .details-item {
    margin-top: 16px;
  }

  .multisig-account {
    display: flex;
    justify-content: center;
  }
}
</style>
