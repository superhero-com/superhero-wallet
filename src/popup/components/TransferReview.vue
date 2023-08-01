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
          :symbol="AE_SYMBOL"
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
          :symbol="AE_SYMBOL"
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      v-if="transferData.selectedAsset.contractId === AE_CONTRACT_ID"
      :label="$t('common.total')"
      class="details-item"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.total"
          :symbol="AE_SYMBOL"
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
} from 'vue';
import { encode, Encoding, Tag } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ITransaction } from '@/types';
import {
  escapeSpecialChars,
  toShiftedBigNumber,
} from '@/utils';
import {
  useAccounts,
  useDeepLinkApi,
  useModals,
  useMultisigAccounts,
  useMultisigTransactions,
  useAeSdk,
  useUi,
  useTippingContracts,
} from '@/composables';
import {
  TX_FUNCTIONS,
  handleUnknownError,
} from '@/popup/utils';
import { ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS } from '@/popup/router/routeNames';
import { AE_CONTRACT_ID, AE_SYMBOL } from '@/protocols/aeternity/config';
import { aeToAettos, isAensNameValid } from '@/protocols/aeternity/helpers';

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
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    const { homeRouteName } = useUi();
    const { openDefaultModal } = useModals();
    const { openCallbackOrGoHome } = useDeepLinkApi({ router });
    const { activeAccount } = useAccounts({ store });

    const {
      activeMultisigAccount,
      addTransactionToPendingMultisigAccount,
      updateMultisigAccounts,
    } = useMultisigAccounts({ store });
    const { getTippingContracts } = useTippingContracts({ store });

    const loading = ref<boolean>(false);
    const { getAeSdk } = useAeSdk({ store });
    const isRecipientName = computed(
      () => props.recipientAddress && isAensNameValid(props.recipientAddress),
    );
    const tokenSymbol = computed(() => props.transferData.selectedAsset?.symbol || '-');
    const isSelectedAssetAex9 = computed(
      () => props.transferData?.selectedAsset?.contractId !== AE_CONTRACT_ID,
    );

    // TODO provide correct fee for the multisig
    const PROPOSE_TRANSACTION_FEE = 0.000182940;

    function openTransactionFailedModal() {
      openDefaultModal({
        title: t('modals.transaction-failed.msg'),
        icon: 'critical',
      });
    }

    async function transfer({ amount, recipient, selectedAsset }: any) {
      const aeSdk = await getAeSdk();
      const isSelectedAssetAeCoin = selectedAsset.contractId === AE_CONTRACT_ID;

      loading.value = true;
      try {
        let actionResult;

        if (props.transferData.invoiceId !== null) {
          actionResult = await store.dispatch('fungibleTokens/burnTriggerPoS', [
            selectedAsset.contractId,
            amount,
            props.transferData.invoiceContract,
            props.transferData.invoiceId,
            { waitMined: false, modal: false },
          ]);
        } else if (!isSelectedAssetAeCoin) {
          actionResult = await store.dispatch('fungibleTokens/transfer', [
            selectedAsset.contractId,
            recipient,
            amount,
            { waitMined: false, modal: false },
          ]);
        } else {
          actionResult = await aeSdk.spendWithCustomOptions(amount, recipient, {
            payload: encode(Buffer.from(props.transferData.payload), Encoding.Bytearray),
            modal: false,
          });
        }

        if (actionResult && !isSelectedAssetAeCoin) {
          const transaction: ITransaction = {
            hash: actionResult.hash,
            pendingTokenTx: true,
            pending: true,
            transactionOwner: activeAccount.value.address,
            tx: {
              amount,
              callerId: activeAccount.value.address,
              contractId: selectedAsset.contractId,
              type: Tag[Tag.ContractCallTx],
              function: TX_FUNCTIONS.transfer,
              recipientId: recipient,
              arguments: [],
              fee: 0,
            },
          };

          store.dispatch('addPendingTransaction', transaction);
        } else if (actionResult) {
          const transaction: ITransaction = {
            hash: actionResult.hash,
            pending: true,
            transactionOwner: activeAccount.value.address,
            tx: {
              amount,
              callerId: activeAccount.value.address,
              contractId: selectedAsset.contractId,
              senderId: activeAccount.value.address,
              recipientId: recipient,
              type: Tag[Tag.SpendTx],
              function: TX_FUNCTIONS.transfer,
              arguments: [],
              fee: 0,
            },
          };

          store.dispatch('addPendingTransaction', transaction);
        }
        emit('success');
        return actionResult.hash;
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
        if (selectedAsset.contractId !== AE_CONTRACT_ID && tippingV2) {
          await store.dispatch('fungibleTokens/createOrChangeAllowance', [
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
              ...{ modal: false } as any, // TODO: `modal` is not a part of aeSdk types
            },
          );
        }
        const transaction: ITransaction = {
          hash: txResult.hash,
          pending: true,
          tipUrl: recipient,
          transactionOwner: activeAccount.value.address,
          tx: {
            amount,
            callerId: activeAccount.value.address,
            contractId: tippingContract.$options.address!,
            type: Tag[Tag.ContractCallTx],
            function: 'tip',
            selectedTokenContractId: selectedAsset.contractId,
            arguments: [],
            fee: 0,
          },
        };
        store.dispatch('addPendingTransaction', transaction);
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
        } = useMultisigTransactions({ store });
        if (activeMultisigAccount.value) {
          const txToPropose = await buildSpendTx(
            activeMultisigAccount.value.gaAccountId,
            props.transferData.address!,
            aeToAettos(props.transferData.amount!),
            props.transferData.payload || undefined,
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
          router.push({ name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS });
        }
      } catch (error) {
        handleUnknownError(error);
      } finally {
        emit('success');
        loading.value = true;
      }
    }

    async function submit(): Promise<void> {
      const {
        amount: amountRaw,
        address: recipient,
        selectedAsset,
        note,
      } = props.transferData;

      if (!amountRaw || !recipient || !selectedAsset) {
        return;
      }

      const amount = (selectedAsset.contractId === AE_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : toShiftedBigNumber(amountRaw, selectedAsset.decimals);

      if (props.isMultisig) {
        await proposeMultisigTransaction();
      } else if (props.isAddressUrl) {
        await sendTip({
          amount,
          recipient,
          selectedAsset,
          note,
        });
      } else {
        const hash = await transfer({
          amount,
          recipient,
          selectedAsset,
        });
        router.push({ name: homeRouteName.value, query: { latestTxHash: hash } });
      }
    }

    return {
      AE_CONTRACT_ID,
      AE_SYMBOL,
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
