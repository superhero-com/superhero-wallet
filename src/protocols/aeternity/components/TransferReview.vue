<template>
  <TransferReviewBase
    :title="isMultisig ? $t('modals.multisigTxProposal.title') : null"
    :without-subtitle="isMultisig"
    :sender-label="isMultisig ? $t('modals.multisigTxProposal.signingAddress') : null"
    :base-token-symbol="AE_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    :avatar-name="isAddressChain ? transferData.address : null"
    :show-fiat="isSelectedAssetAex9"
    :protocol="PROTOCOL_AETERNITY"
    class="transfer-review"
  >
    <template #subheader>
      <div
        v-if="isMultisig"
        class="multisig-account"
      >
        <AccountItem :address="activeMultisigAccount.gaAccountId" />
      </div>
    </template>

    <template
      v-if="isAddressUrl"
      #recipient
    >
      <DetailsItem
        data-cy="review-tip-url"
        class="tip-url details-item"
        :label="$t('pages.send.receivingUrl')"
        :value="transferData.address"
      />
    </template>

    <template #additional-fee>
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
    </template>

    <template #total>
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
    </template>
  </TransferReviewBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { Tag } from '@aeternity/aepp-sdk';
import type { TransferFormModel, ITransaction } from '@/types';
import {
  escapeSpecialChars,
  handleUnknownError,
  toShiftedBigNumber,
} from '@/utils';
import {
  useAccounts,
  useDeepLinkApi,
  useModals,
  useMultisigAccounts,
  useMultisigTransactions,
  useTippingContracts,
  useTransactionList,
  useUi,
} from '@/composables';
import { AE_SYMBOL, AE_CONTRACT_ID, TX_FUNCTIONS } from '@/protocols/aeternity/config';
import { ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS } from '@/popup/router/routeNames';
import { PROTOCOL_AETERNITY } from '@/constants';
import { aeToAettos } from '@/protocols/aeternity/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import AccountItem from '@/popup/components/AccountItem.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';

export default defineComponent({
  name: 'AeTransferReview',
  components: {
    TokenAmount,
    DetailsItem,
    TransferReviewBase,
    AccountItem,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    recipientAddress: { type: String, default: null },
    amount: { type: Number, default: null },
    isMultisig: Boolean,
    isAddressChain: Boolean,
    isAddressUrl: Boolean,
  },
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();

    const { homeRouteName } = useUi();
    const { openDefaultModal } = useModals();
    const { openCallbackOrGoHome } = useDeepLinkApi({ router });
    const { upsertCustomPendingTransactionForAccount } = useTransactionList({ store });
    const { activeAccount } = useAccounts({ store });
    const {
      activeMultisigAccount,
      addTransactionToPendingMultisigAccount,
      updateMultisigAccounts,
    } = useMultisigAccounts({ store });
    const { getTippingContracts } = useTippingContracts({ store });

    const loading = ref<boolean>(false);

    // TODO provide correct fee for the multisig
    const PROPOSE_TRANSACTION_FEE = 0.000182940;

    const isSelectedAssetAex9 = computed(
      () => props.transferData?.selectedAsset?.contractId !== AE_CONTRACT_ID,
    );

    function openTransactionFailedModal() {
      openDefaultModal({
        title: t('modals.transaction-failed.msg'),
        icon: 'critical',
      });
    }

    async function transfer({ amount, recipient, selectedAsset }: any) {
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
          const aeternityAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_AETERNITY);
          actionResult = await aeternityAdapter.spend(amount, recipient, {
            payload: props.transferData.payload,
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
          upsertCustomPendingTransactionForAccount(activeAccount.value.address, transaction);
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

          upsertCustomPendingTransactionForAccount(activeAccount.value.address, transaction);
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
        upsertCustomPendingTransactionForAccount(activeAccount.value.address, transaction);
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
      PROTOCOL_AETERNITY,
      isSelectedAssetAex9,
      activeMultisigAccount,
      AE_SYMBOL,
      AE_CONTRACT_ID,
      PROPOSE_TRANSACTION_FEE,
      loading,
      submit,
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
