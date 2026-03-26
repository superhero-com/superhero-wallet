<template>
  <TransferReviewBase
    :title="headerTitle"
    :subtitle="headerSubtitle"
    :without-subtitle="isMultisig"
    :sender-label="isMultisig ? $t('modals.multisigTxProposal.signingAddress') : undefined"
    :amount-label="recipientsCount > 1 ? $t('pages.send.singleAccountLabel') : undefined"
    :fee-label="isMultisig ? $t('transaction.proposalTransactionFee') : undefined"
    :base-token-symbol="AE_SYMBOL"
    :transfer-data="displayTransferData"
    :loading="loading"
    :show-fiat="showTotal"
    :protocol="PROTOCOLS.aeternity"
    :no-header-padding="isActiveAccountAirGap"
    class="transfer-review"
  >
    <template #title>
      <div class="custom-header-title">
        {{ headerTitle }}
        <BtnHelp
          v-if="isActiveAccountAirGap && !isMultisig"
          :title="$t('airGap.scan.help.title')"
          :msg="$t('airGap.scan.help.msg')"
          icon="qr-scan"
          full-screen
        />
      </div>
    </template>
    <template #subheader>
      <div
        v-if="isMultisig"
        class="multisig-account"
      >
        <AccountItem
          :address="activeMultisigAccount?.gaAccountId || ''"
          :protocol="PROTOCOLS.aeternity"
        />
      </div>
      <TransferQRCodeGenerator
        v-if="isActiveAccountAirGap && !isMultisig"
        :transfer-data="displayTransferData"
      />
    </template>

    <template
      v-if="isAddressUrl"
      #recipient
    >
      <DetailsItem
        data-cy="review-tip-url"
        class="tip-url details-item"
        :label="$t('pages.send.receivingUrl')"
        :value="transferData.addresses?.[0]"
      />
    </template>

    <template #additional-fee>
      <DetailsItem
        v-if="isMultisig"
        class="details-item additional-fee"
        :label="$t('transaction.fee')"
      >
        <template #value>
          <TokenAmount
            :amount="+aettosToAe(AE_GET_META_TX_FEE)"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
            high-precision
            data-cy="multisig-review-fee"
          />
        </template>
      </DetailsItem>
      <DetailsItem
        v-if="transferData.gasUsed"
        :label="isMultisig
          ? $t('transaction.proposalEstimatedGasUsed')
          : $t('transaction.estimatedGasUsed')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="transferData.gasUsed"
            symbol=" "
            :protocol="PROTOCOLS.aeternity"
            hide-fiat
          />
        </template>
      </DetailsItem>

      <DetailsItem
        v-if="transferData.gasPrice"
        :label="$t('pages.transactionDetails.gasPrice')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="transferData.gasPrice"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
          />
        </template>
      </DetailsItem>

      <DetailsItem
        v-if="gasCost"
        :label="isMultisig
          ? $t('transaction.proposalGasCost')
          : $t('transaction.gasCost')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+gasCost.toString()"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
          />
        </template>
      </DetailsItem>
    </template>

    <template #total>
      <DetailsItem
        v-if="showTotal"
        :label="isMultisig
          ? $t('transaction.proposalTotal')
          : $t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+(displayTransferData?.total || 0)"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
            high-precision
            data-cy="review-total"
          />
        </template>
      </DetailsItem>
    </template>

    <template #bottom>
      <AccordionItem
        v-if="isAdvancedSettingsAvailable"
        class="advanced-settings"
        :label="$t('transaction.advancedDetails')"
        variant="muted"
      >
        <InputField
          data-cy="advanced-fee-input"
          :model-value="feeInput"
          :label="$t('transaction.fee')"
          type="number"
          :message="feeInputMessage"
          @update:modelValue="handleFeeInput"
        />

        <InputField
          data-cy="advanced-nonce-input"
          :model-value="nonceInput"
          :label="$t('common.nonce')"
          type="number"
          integer
          :message="nonceInputMessage"
          @update:modelValue="handleNonceInput"
        />
      </AccordionItem>
    </template>
  </TransferReviewBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Contract, Encoded, Tag } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';

import type {
  IInputMessage,
  TransferFormModel,
  ITransaction,
  ITransferArgs,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  escapeSpecialChars,
  toShiftedBigNumber,
} from '@/utils';
import { tg } from '@/popup/plugins/i18n';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
  useFungibleTokens,
  useLatestTransactionList,
  useMultisigAccounts,
  useMultisigTransactions,
  useTippingContracts,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS } from '@/popup/router/routeNames';

import type { ContractInitializeOptions } from '@/protocols/aeternity/types';
import {
  AE_SYMBOL,
  AE_CONTRACT_ID,
  TX_FUNCTIONS,
  AE_GET_META_TX_FEE,
} from '@/protocols/aeternity/config';
import {
  aeToAettos,
  aettosToAe,
  isAccountNotFoundError,
} from '@/protocols/aeternity/helpers';
import {
  getAdjustedTransferTotal,
  getNonceWarningMessageKey,
} from '@/protocols/aeternity/helpers/transferReview';
import ZeitTokenACI from '@/protocols/aeternity/aci/FungibleTokenFullACI.json';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import TransferQRCodeGenerator from '@/popup/components/TransferQRCodeGenerator.vue';
import AccordionItem from '@/popup/components/AccordionItem.vue';
import AccountItem from '@/popup/components/AccountItem.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import InputField from '@/popup/components/InputField.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import Logger from '@/lib/logger';

export default defineComponent({
  name: 'AeTransferReview',
  components: {
    AccordionItem,
    InputField,
    TokenAmount,
    DetailsItem,
    TransferQRCodeGenerator,
    TransferReviewBase,
    AccountItem,
    BtnHelp,
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
  emits: ['success', 'error', 'update:transferData'],
  setup(props, { emit }) {
    const router = useRouter();
    const { t } = useI18n();

    const { homeRouteName } = useUi();
    const { openCallbackOrGoHome } = useDeepLinkApi();
    const { addAccountPendingTransaction, allLatestTransactions } = useLatestTransactionList();
    const { activeAccount, isActiveAccountAirGap } = useAccounts();
    const { getAeSdk } = useAeSdk();
    const {
      activeMultisigAccount,
      addTransactionToPendingMultisigAccount,
      updateMultisigAccounts,
    } = useMultisigAccounts();
    const {
      buildSpendTx,
      proposeTx,
      postSpendTx,
    } = useMultisigTransactions();
    const { getTippingContracts } = useTippingContracts();
    const {
      createOrChangeAllowance,
    } = useFungibleTokens();

    const loading = ref<boolean>(false);
    const feeInput = ref(new BigNumber(props.transferData.fee || 0).toFixed());
    const nonceInput = ref(props.transferData.nonce?.toString() || '');
    const currentAccountNonce = ref<number | null>(props.transferData.nonce ?? null);

    const recipientsCount = computed(() => (props.transferData.addresses?.length || 1));
    const isAdvancedSettingsAvailable = computed(() => (
      !props.isMultisig
      && !props.isAddressUrl
      && props.transferData.invoiceId == null
    ));
    const minimumFee = computed(
      () => new BigNumber(props.transferData.estimatedFee || props.transferData.fee || 0),
    );
    const enteredFee = computed(() => {
      const value = new BigNumber(feeInput.value || NaN);
      return value.isFinite() && value.isGreaterThan(0)
        ? value
        : null;
    });
    const selectedFee = computed(() => {
      if (enteredFee.value?.isGreaterThanOrEqualTo(minimumFee.value)) {
        return enteredFee.value;
      }
      return minimumFee.value;
    });
    const parsedNonce = computed<number | null>(() => {
      if (!nonceInput.value.length || !/^\d+$/.test(nonceInput.value)) {
        return null;
      }
      return Number(nonceInput.value);
    });
    const adjustedTotal = computed(() => {
      const baseTotal = props.transferData.estimatedTotal ?? props.transferData.total;
      return getAdjustedTransferTotal(
        baseTotal,
        minimumFee.value,
        selectedFee.value,
      ) ?? props.transferData.total;
    });
    const displayTransferData = computed<TransferFormModel>(() => ({
      ...props.transferData,
      fee: selectedFee.value,
      nonce: parsedNonce.value ?? undefined,
      total: adjustedTotal.value,
    }));
    const hasPendingTransactionWithSameNonce = computed(() => (
      parsedNonce.value != null
      && allLatestTransactions.value.some((transaction) => (
        'transactionOwner' in transaction
        && transaction.transactionOwner === activeAccount.value.address
        && transaction.pending
        && transaction.protocol === PROTOCOLS.aeternity
        && transaction.tx?.nonce === parsedNonce.value
      ))
    ));
    const feeInputMessage = computed<IInputMessage | undefined>(() => {
      if (!enteredFee.value) {
        return {
          status: 'error',
          text: t('transaction.advancedFeeInvalid'),
        };
      }
      if (enteredFee.value.isLessThan(minimumFee.value)) {
        return {
          status: 'error',
          text: t('transaction.advancedFeeTooLow'),
        };
      }
      return undefined;
    });
    const nonceInputMessage = computed<IInputMessage | undefined>(() => {
      if (parsedNonce.value == null || parsedNonce.value < 1) {
        return {
          status: 'error',
          text: t('transaction.advancedNonceInvalid'),
        };
      }
      const warningMessageKey = getNonceWarningMessageKey(
        parsedNonce.value,
        currentAccountNonce.value,
        hasPendingTransactionWithSameNonce.value,
      );
      if (warningMessageKey) {
        return {
          status: 'warning',
          text: warningMessageKey === 'replacement'
            ? t('transaction.advancedNonceReplacementWarning')
            : t('transaction.advancedNonceLowWarning'),
        };
      }
      return undefined;
    });
    const hasAdvancedSettingsError = computed(() => (
      isAdvancedSettingsAvailable.value
      && (
        feeInputMessage.value?.status === 'error'
        || nonceInputMessage.value?.status === 'error'
      )
    ));

    const showTotal = computed(
      () => (
        props.transferData?.selectedAsset?.contractId === AE_CONTRACT_ID
        || !!props.transferData?.selectedAsset?.price
      ),
    );

    const headerTitle = computed(() => {
      if (props.isMultisig) {
        return tg('modals.multisigTxProposal.title');
      }
      if (isActiveAccountAirGap.value) {
        return tg('airGap.send.reviewTitle');
      }
      return tg('pages.send.reviewtx');
    });

    const headerSubtitle = computed(() => {
      if (isActiveAccountAirGap.value) {
        return tg('airGap.send.reviewSubtitle');
      }
      if (recipientsCount.value > 1) {
        return tg('pages.send.multicheckalert');
      }
      return tg('pages.send.checkalert');
    });

    const gasCost = computed(
      () => props.transferData.gasPrice && props.transferData.gasUsed
        ? new BigNumber(props.transferData.gasPrice).multipliedBy(props.transferData.gasUsed)
        : 0,
    );

    function emitTransferDataUpdate() {
      if (!isAdvancedSettingsAvailable.value) {
        return;
      }

      const nextFee = selectedFee.value.toFixed();
      const currentFee = new BigNumber(props.transferData.fee || 0).toFixed();
      const nextNonce = parsedNonce.value ?? undefined;
      const currentNonce = props.transferData.nonce;
      const nextTotal = adjustedTotal.value ?? undefined;
      const currentTotal = props.transferData.total;

      if (
        currentFee === nextFee
        && currentNonce === nextNonce
        && currentTotal === nextTotal
      ) {
        return;
      }

      emit('update:transferData', displayTransferData.value);
    }

    function handleFeeInput(value: string) {
      feeInput.value = value;
    }

    function handleNonceInput(value: string) {
      nonceInput.value = value;
    }

    async function fetchCurrentAccountNonce() {
      const aeSdk = await getAeSdk();
      try {
        const { nonce } = await aeSdk.api.getAccountByPubkey(activeAccount.value.address);
        return nonce + 1;
      } catch (error) {
        if (isAccountNotFoundError(error)) {
          return 1;
        }
        throw error;
      }
    }

    async function openTransactionFailedModal(msg: string) {
      await Logger.write({
        title: t('modals.transaction-failed.title'),
        message: msg || t('modals.transaction-failed.msg'),
        type: 'api-response',
        modal: true,
      });
    }

    async function burnTriggerPoS(
      address: Encoded.ContractAddress,
      posAddress: string,
      invoiceId: string,
      amount: number,
      options: ContractInitializeOptions,
    ) {
      const aeSdk = await getAeSdk();
      const tokenContract = await Contract.initialize({
        ...aeSdk.getContext(),
        aci: ZeitTokenACI,
        address,
      });
      return tokenContract.burn_trigger_pos(
        amount.toFixed(),
        posAddress,
        invoiceId,
        options,
      );
    }

    async function transfer({
      amount, recipient, selectedAsset, nonce, fee,
    }: ITransferArgs): Promise<string | undefined> {
      const isSelectedAssetAeCoin = selectedAsset.contractId === AE_CONTRACT_ID;

      loading.value = true;
      try {
        let actionResult;

        if (props.transferData.invoiceId !== null) {
          actionResult = await burnTriggerPoS(
            selectedAsset.contractId as Encoded.ContractAddress,
            new BigNumber(amount).toFixed().toString(),
            props.transferData.invoiceContract,
            props.transferData.invoiceId,
            {
              waitMined: false,
              nonce,
              fee,
            },
          );
        } else if (!isSelectedAssetAeCoin) {
          const aeternityAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);
          actionResult = await aeternityAdapter.transferToken?.(
            new BigNumber(amount).toFixed().toString(),
            recipient,
            selectedAsset.contractId as Encoded.ContractAddress,
            {
              waitMined: false,
              // in case of custom AEX9 token, we need to pass it to avoid the error
              omitUnknown: true,
              nonce,
              fee,
            },
          );
        } else {
          const aeternityAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);
          actionResult = await aeternityAdapter.spend(Number(amount), recipient, {
            payload: props.transferData.payload,
            waitMined: false,
            nonce,
            fee,
          });
        }

        if (actionResult) {
          const transaction: ITransaction = {
            hash: actionResult.hash as Encoded.TxHash,
            pending: true,
            transactionOwner: activeAccount.value.address,
            protocol: PROTOCOLS.aeternity,
            tx: {
              amount: Number(amount),
              callerId: activeAccount.value.address,
              contractId: selectedAsset.contractId as Encoded.ContractAddress,
              senderId: activeAccount.value.address,
              type: (isSelectedAssetAeCoin) ? Tag[Tag.SpendTx] : Tag[Tag.ContractCallTx],
              function: TX_FUNCTIONS.transfer,
              recipientId: recipient,
              arguments: [],
              fee: Number(fee || 0),
              nonce,
            },
          };
          addAccountPendingTransaction(activeAccount.value.address, transaction);
        }

        // TODO find out if emitting success in case falsy `actionResult` makes sense.
        emit('success');
        return actionResult?.hash;
      } catch (error: any) {
        openTransactionFailedModal(error.message);
        return undefined;
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
          await createOrChangeAllowance(
            selectedAsset.contractId,
            props.amount,
          );
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
            },
          );
        }
        const transaction: ITransaction = {
          hash: txResult.hash,
          pending: true,
          protocol: PROTOCOLS.aeternity,
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
        addAccountPendingTransaction(activeAccount.value.address, transaction);
        openCallbackOrGoHome(true);
        emit('success');
      } catch (error: any) {
        await openTransactionFailedModal(error.message);
        openCallbackOrGoHome(false);

        error.payload = { url: recipient };
      } finally {
        loading.value = false;
      }
    }

    async function proposeMultisigTransaction() {
      loading.value = true;
      try {
        if (activeMultisigAccount.value) {
          const txToPropose = await buildSpendTx(
            activeMultisigAccount.value.gaAccountId as Encoded.AccountAddress,
            props.transferData.addresses?.[0]!,
            aeToAettos(props.transferData.amount!),
            props.transferData.payload || undefined,
          );

          const { proposeTxHash } = await proposeTx(
            txToPropose,
            activeMultisigAccount.value.contractId,
          );

          if (activeMultisigAccount.value.pending) {
            addTransactionToPendingMultisigAccount(
              proposeTxHash,
              activeMultisigAccount.value.gaAccountId,
              activeAccount.value.address,
            );
          }

          await postSpendTx(txToPropose, proposeTxHash);
          await updateMultisigAccounts();
          emit('success');
          router.push({ name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS });
        }
      } catch (error: any) {
        openTransactionFailedModal(error.message);
      } finally {
        loading.value = false;
      }
    }

    async function submit(): Promise<void> {
      if (hasAdvancedSettingsError.value) {
        return;
      }

      const effectiveTransferData = displayTransferData.value;

      if (isActiveAccountAirGap.value && !props.isMultisig) {
        emit('success');
        return;
      }

      const {
        amount: amountRaw,
        addresses: recipients,
        selectedAsset,
        note,
      } = effectiveTransferData;

      if (!amountRaw || !recipients?.length || !selectedAsset) {
        return;
      }

      const amount = (selectedAsset.contractId === AE_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : toShiftedBigNumber(amountRaw, selectedAsset.decimals!);

      if (props.isMultisig) {
        await proposeMultisigTransaction();
      } else if (props.isAddressUrl) {
        await sendTip({
          amount,
          recipient: recipients[0],
          selectedAsset,
          note,
        });
      } else {
        let hash;
        const customFee = effectiveTransferData.fee
          ? aeToAettos(
            new BigNumber(effectiveTransferData.fee).dividedBy(recipients.length || 1),
          )
          : undefined;
        let currentNonce = effectiveTransferData.nonce || await fetchCurrentAccountNonce();
        // eslint-disable-next-line no-restricted-syntax
        for (const recipient of recipients) {
          // eslint-disable-next-line no-await-in-loop
          hash = await transfer({
            amount,
            recipient,
            selectedAsset,
            nonce: currentNonce,
            fee: customFee,
          });
          currentNonce += 1;
        }
        if (hash) {
          router.push({ name: homeRouteName.value, query: { latestTxHash: hash } });
        }
      }
    }

    watch(
      [feeInput, nonceInput],
      () => emitTransferDataUpdate(),
    );

    watch(
      hasAdvancedSettingsError,
      (value) => emit('error', value),
      { immediate: true },
    );

    onMounted(async () => {
      if (!isAdvancedSettingsAvailable.value) {
        emit('error', false);
        return;
      }

      currentAccountNonce.value = await fetchCurrentAccountNonce();
      if (!nonceInput.value.length) {
        nonceInput.value = currentAccountNonce.value.toString();
      }
      emitTransferDataUpdate();
    });

    return {
      PROTOCOLS,
      recipientsCount,
      displayTransferData,
      gasCost,
      isActiveAccountAirGap,
      activeMultisigAccount,
      aettosToAe,
      AE_SYMBOL,
      AE_CONTRACT_ID,
      AE_GET_META_TX_FEE,
      loading,
      headerTitle,
      headerSubtitle,
      isAdvancedSettingsAvailable,
      feeInput,
      nonceInput,
      feeInputMessage,
      nonceInputMessage,
      handleFeeInput,
      handleNonceInput,
      showTotal,
      submit,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.transfer-review {
  .details-item {
    margin-top: 16px;

    &.additional-fee {
      border-bottom: 1px solid rgba($color-white, 0.15);
    }
  }

  .custom-header-title {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .multisig-account {
    display: flex;
    justify-content: center;
  }

  .advanced-settings {
    margin-top: 24px;
  }
}
</style>
