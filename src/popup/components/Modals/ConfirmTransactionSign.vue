<template>
  <Modal
    show
    full-screen
    class="confirm-transaction-sign"
    data-cy="popup-aex2"
  >
    <AnimatedSpinner
      v-if="loading"
      class="loader"
    />

    <template v-else>
      <TransactionOverview
        :transaction="completeTransaction"
        :additional-tag="isAeppChatSuperhero
          ? $t('modals.confirmTransactionSign.superheroChat')
          : null"
      />
      <div
        v-if="isAeppChatSuperhero || error"
        class="subtitle"
        :class="{ warning: !!error }"
      >
        <template v-if="!!error">
          {{ $t('modals.confirmTransactionSign.unableToExecute') }}
        </template>
        <template v-else>
          <span class="app-name">{{ $t('modals.confirmTransactionSign.superheroChat') }}</span>
          {{ $t('modals.confirmTransactionSign.confirmSigning') }}
        </template>
      </div>
      <DetailsItem
        v-if="!!error"
        :label="$t('pages.transactionDetails.reason')"
        :value="error"
        class="reason"
        data-cy="reason"
      />
      <DetailsItem
        v-if="decodedCallData?.functionName"
        :label="$t('modals.confirmTransactionSign.functionName')"
        :value="decodedCallData.functionName"
      />

      <template v-if="(isDex || isDexAllowance) && tokenList.length">
        <TransactionDetailsPoolTokenRow
          v-for="(token, idx) in tokenList"
          :key="token.contractId"
          :token="token"
          :tokens="token.tokens"
          :label="getLabels(token, idx)"
          :hide-amount="isSwap"
        />
      </template>
      <DetailsItem
        v-if="nameAeFee"
        :label="$t('modals.confirmTransactionSign.nameFee')"
        class="name-fee"
      >
        <template #value>
          <TokenAmount
            :amount="nameAeFee"
            :protocol="PROTOCOL_AETERNITY"
          />
        </template>
      </DetailsItem>

      <div class="details">
        <DetailsItem
          v-if="isSwap"
          :label="swapDirectionTranslation"
        >
          <TokenAmount
            :amount="tokenAmount"
            :symbol="tokenSymbol"
            :aex9="isTransactionAex9(transactionWrapped)"
            :hide-fiat="!swapTokenAmountData.isAe"
            :protocol="PROTOCOL_AETERNITY"
            data-cy="total"
          />
        </DetailsItem>

        <DetailsItem :label="$t('transaction.fee')">
          <TokenAmount
            :amount="txAeFee"
            :protocol="PROTOCOL_AETERNITY"
            data-cy="fee"
          />
        </DetailsItem>

        <DetailsItem
          v-if="swapDirection === 'total'"
          :label="$t('common.total')"
        >
          <TokenAmount
            :amount="executionCost || totalAmount"
            :symbol="getTxSymbol(popupProps?.tx)"
            :aex9="isTransactionAex9(transactionWrapped)"
            :protocol="PROTOCOL_AETERNITY"
            data-cy="total"
          />
        </DetailsItem>
      </div>

      <DetailsItem
        expandable
        :label="$t('transaction.advancedDetails')"
      >
        <DetailsItem
          v-if="decodedCallData?.functionName"
          :label="$t('modals.confirmTransactionSign.functionName')"
          :value="decodedCallData.functionName"
        />
        <DetailsItem
          v-if="transactionArguments"
          :label="$t('modals.confirmTransactionSign.arguments')"
          :value="transactionArguments"
        />
        <DetailsItem
          v-for="key in filteredTxFields"
          :key="key"
          :label="getTxKeyLabel(key)"
          :value="popupProps?.tx?.[key]"
          :class="{ 'hash-field': isHash(key) }"
        />
      </DetailsItem>
    </template>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        third
        extra-padded
        :text="$t('pages.signTransaction.reject')"
        @click="cancel()"
      />
      <BtnMain
        class="button-action-primary"
        data-cy="accept"
        third
        :disabled="!!error || verifying"
        :icon="verifying ? AnimatedSpinner : null"
        :text="verifying ? $t('common.verifying') : $t('common.confirm')"
        @click="popupProps?.resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';
import { camelCase } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import { Encoded, getExecutionCost } from '@aeternity/aepp-sdk';
import { ContractByteArrayEncoder, BytecodeContractCallEncoder } from '@aeternity/aepp-calldata';

import JsonBig from '@/lib/json-big';
import type {
  ITokenResolved,
  ITransaction,
  ITx,
  TxArguments,
  TxFunctionParsed,
  TxFunctionRaw,
} from '@/types';
import { AeDecodedCallData } from '@/protocols/aeternity/types';
import { tg } from '@/popup/plugins/i18n';
import { RejectedByUserError } from '@/lib/errors';
import {
  SUPERHERO_CHAT_URL,
  PROTOCOL_AETERNITY,
  TX_DIRECTION,
} from '@/constants';
import {
  fetchJson,
  handleUnknownError,
  isNotFoundError,
  toShiftedBigNumber,
} from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useFungibleTokens,
  usePopupProps,
  useTransactionTx,
} from '@/composables';
import {
  AE_SYMBOL,
  DEX_TRANSACTION_TAGS,
  DEX_PROVIDE_LIQUIDITY,
  DEX_REMOVE_LIQUIDITY,
} from '@/protocols/aeternity/config';
import {
  getAeFee,
  getTransactionTokenInfoResolver,
  isTransactionAex9,
  isTxFunctionDexSwap,
  isTxFunctionDexPool,
  isTxFunctionDexMaxSpent,
  isTxFunctionDexMinReceived,
} from '@/protocols/aeternity/helpers';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TransactionOverview from '../TransactionOverview.vue';
import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import TransactionDetailsPoolTokenRow from '../TransactionDetailsPoolTokenRow.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';

type ITxKey = keyof ITx;

const TX_FIELDS_TO_DISPLAY: Partial<Record<ITxKey, () => string>> = {
  callData: () => tg('common.callData'),
  code: () => tg('pages.transactionDetails.code'),
  contractId: () => tg('common.contractId'),
  commitmentId: () => tg('modals.confirmTransactionSign.commitmentId'),
  name: () => tg('pages.transactionDetails.name'),
  nameFee: () => tg('modals.confirmTransactionSign.nameFee'),
  nameSalt: () => tg('pages.transactionDetails.nameSalt'),
  nameId: () => tg('pages.transactionDetails.nameId'),
  nonce: () => tg('pages.transactionDetails.nonce'),
  payload: () => tg('pages.transactionDetails.payload'),
  pointers: () => tg('modals.confirmTransactionSign.pointers'),
  recipientId: () => tg('modals.confirmTransactionSign.recipientId'),
};

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    TransactionOverview,
    DetailsItem,
    TokenAmount,
    TransactionDetailsPoolTokenRow,
    AnimatedSpinner,
  },
  setup() {
    const { t } = useI18n();

    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { getAeSdk } = useAeSdk();
    const { getLastActiveProtocolAccount } = useAccounts();
    const { popupProps, setPopupProps } = usePopupProps();
    const { availableTokens, getTxSymbol, getTxAmountTotal } = useFungibleTokens();

    const {
      direction,
      isDexAllowance,
      isDex,
      setTransactionTx,
    } = useTransactionTx({
      tx: popupProps.value?.tx,
    });

    const showAdvanced = ref(false);
    const tokenList = ref<ITokenResolved[]>([]);
    const txFunction = ref<TxFunctionRaw | undefined>();
    const executionCost = ref(0);
    const loading = ref(false);
    const error = ref('');
    const verifying = ref(false);
    const decodedCallData = ref<AeDecodedCallData | undefined>();

    const isAeppChatSuperhero = computed(
      () => `${popupProps.value?.app?.protocol}//${popupProps.value?.app?.name}` === SUPERHERO_CHAT_URL,
    );
    const transactionWrapped = computed(
      (): Partial<ITransaction> => ({ tx: popupProps.value?.tx as any }),
    );

    const isSwap = computed(() => isTxFunctionDexSwap(txFunction.value));
    const isPool = computed(() => isTxFunctionDexPool(txFunction.value));
    const isMaxSpent = computed(() => isTxFunctionDexMaxSpent(txFunction.value));
    const isMinReceived = computed(() => isTxFunctionDexMinReceived(txFunction.value));
    const txAeFee = computed(() => getAeFee(popupProps.value?.tx?.fee!));
    const nameAeFee = computed(() => getAeFee(popupProps.value?.tx?.nameFee!));

    const activeAccount = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);

    const swapDirection = computed(() => {
      if (isMaxSpent.value) {
        return 'maxSpent';
      }
      if (isMinReceived.value) {
        return 'minReceived';
      }
      return 'total';
    });

    const swapDirectionTranslation = computed(() => {
      switch (swapDirection.value) {
        case 'maxSpent': return t('pages.signTransaction.maxSpent');
        case 'minReceived': return t('pages.signTransaction.minReceived');
        default: return t('common.total');
      }
    });

    const totalAmount = computed(
      () => getTxAmountTotal(transactionWrapped.value as ITransaction, direction.value),
    );

    const singleToken = computed((): ITokenResolved => ({
      isReceived: direction.value === TX_DIRECTION.received,
      amount: totalAmount.value,
      symbol: getTxSymbol(popupProps.value?.tx as any),
    }));

    const filteredTxFields = computed(
      () => (Object.keys(TX_FIELDS_TO_DISPLAY) as ITxKey[])
        .filter((field) => !!popupProps.value?.tx?.[field]),
    );

    const swapTokenAmountData = computed((): ITokenResolved => {
      const token = swapDirection.value === 'maxSpent' ? tokenList.value[0] : tokenList.value[1];
      return token || {};
    });

    const tokenAmount = computed((): number => +toShiftedBigNumber(
      swapTokenAmountData.value.amount || 0,
      -(swapTokenAmountData.value.decimals || 0),
    ));

    const tokenSymbol = computed(
      () => swapTokenAmountData.value.isAe ? AE_SYMBOL : swapTokenAmountData.value.symbol,
    );

    const completeTransaction = computed(
      () => ({ tx: { ...popupProps.value?.tx, function: txFunction.value } }),
    );

    const isProvideLiquidity = computed(
      () => txFunction.value && DEX_TRANSACTION_TAGS[txFunction.value] === DEX_PROVIDE_LIQUIDITY,
    );

    const transactionArguments = computed(() => decodedCallData.value?.args?.length
      ? JsonBig.stringify(decodedCallData.value.args)
      : undefined);

    function getTokens(txParams: ITx): ITokenResolved[] {
      if (!isDex.value && !isDexAllowance.value) {
        return [singleToken.value];
      }
      const functionName = camelCase(txParams.function) as TxFunctionParsed;
      const resolver = getTransactionTokenInfoResolver(functionName);
      if (!resolver) {
        return [];
      }
      const tokens = resolver(
        { tx: { ...txParams, ...popupProps.value?.tx } } as ITransaction,
        availableTokens.value,
      )?.tokens;
      if (!isPool.value) {
        return tokens;
      }
      if (isProvideLiquidity.value) {
        return tokens.filter((token) => !token.isPool);
      }
      return tokens.reverse();
    }

    function isHash(key: ITxKey) {
      const propertiesWithHashValues: ITxKey[] = ['callData', 'contractId'];
      return propertiesWithHashValues.includes(key);
    }

    function getLabels(token: any, idx: number) {
      if (isDexAllowance.value) {
        return t('pages.signTransaction.approveUseOfToken');
      }
      if (isSwap.value) {
        return !idx ? t('pages.signTransaction.from') : t('pages.signTransaction.to');
      }
      if (isPool.value && isProvideLiquidity.value) {
        return token.isPool ? '' : t('pages.signTransaction.maximumDeposited');
      }
      if (
        isPool.value
        && txFunction.value
        && DEX_TRANSACTION_TAGS[txFunction.value] === DEX_REMOVE_LIQUIDITY
      ) {
        return token.isPool
          ? t('pages.signTransaction.poolTokenSpent')
          : t('pages.signTransaction.minimumWithdrawn');
      }
      return '';
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    async function verifyTransaction() {
      if (popupProps.value?.txBase64) {
        try {
          verifying.value = true;
          const sdk = await getAeSdk();
          const balance = await sdk.getBalance(activeAccount!.address).catch((err) => {
            if (!isNotFoundError(err)) {
              handleUnknownError(err);
            }
            return 0;
          });
          // We've chosen the approach to trust the aepp itself in amount of gas,
          // they think is needed
          const executionCostAettos = getExecutionCost(popupProps.value.txBase64).toString();
          executionCost.value = getAeFee(executionCostAettos);

          if (new BigNumber(balance).isLessThan(executionCostAettos)) {
            error.value = t('validation.enoughCoin');
            return;
          }
          if (popupProps.value.tx?.contractId) {
            const dryRunResult = await sdk.txDryRun(
              popupProps.value.txBase64,
              popupProps.value.tx.callerId || popupProps.value.tx.senderId!,
            );
            if (dryRunResult.callObj && dryRunResult.callObj.returnType !== 'ok') {
              error.value = new ContractByteArrayEncoder().decode(
                dryRunResult.callObj.returnValue as Encoded.ContractBytearray,
              );
            }
          }
        } catch (e: any) {
          error.value = e.message;
        } finally {
          verifying.value = false;
        }
      }
    }

    async function loadAdditionalContractCallInfo() {
      if (popupProps.value?.tx?.contractId && popupProps.value.tx.callData) {
        try {
          loading.value = true;
          setTimeout(() => { loading.value = false; }, 20000);

          const [
            { bytecode },
          ] = await Promise.all([
            fetchJson(`${aeActiveNetworkSettings.value.nodeUrl}/v3/contracts/${popupProps.value.tx.contractId}/code`),
            // aeSdk is needed to establish the `networkId` and the dex contracts for the network
            getAeSdk(),
          ]);

          const bytecodeContractCallEncoder = new BytecodeContractCallEncoder(bytecode);

          decodedCallData.value = bytecodeContractCallEncoder.decodeCall(
            popupProps.value.tx.callData,
          ) as AeDecodedCallData;

          if (!decodedCallData.value) return;

          const txParams = {
            function: decodedCallData.value.functionName as TxFunctionRaw,
            arguments: decodedCallData.value.args.map((arg: any) => ({
              type: Array.isArray(arg) ? 'list' : 'any',
              value: Array.isArray(arg) ? arg.map((element) => ({ value: element })) : arg,
            })) as TxArguments[],
          };

          txFunction.value = txParams.function;

          setTransactionTx({ ...txParams, ...popupProps.value.tx });

          const allTokens = getTokens({ ...txParams, ...popupProps.value.tx });

          tokenList.value = allTokens.map((token) => ({
            ...token,
            tokens: token.isPool && !isProvideLiquidity.value
              ? allTokens.filter((tkn) => !tkn.isPool).reverse()
              : [token],
          }));
        } catch (e) {
          tokenList.value = [];
          txFunction.value = undefined;
        } finally {
          loading.value = false;
        }
      }
    }

    function getTxKeyLabel(txKey: ITxKey) {
      const translateFunc = TX_FIELDS_TO_DISPLAY[txKey];
      return translateFunc ? translateFunc() : '';
    }

    onMounted(async () => {
      if (popupProps.value) {
        await Promise.all([
          verifyTransaction(),
          loadAdditionalContractCallInfo(),
        ]);
      } else {
        error.value = t('modals.transaction-failed.msg');
      }
    });

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      AE_SYMBOL,
      AnimatedSpinner,
      PROTOCOL_AETERNITY,
      TX_FIELDS_TO_DISPLAY,
      cancel,
      completeTransaction,
      decodedCallData,
      error,
      executionCost,
      filteredTxFields,
      getLabels,
      getTxKeyLabel,
      getTxSymbol,
      isAeppChatSuperhero,
      isDex,
      isDexAllowance,
      isHash,
      isSwap,
      isTransactionAex9,
      loading,
      nameAeFee,
      popupProps,
      showAdvanced,
      swapDirection,
      swapDirectionTranslation,
      swapTokenAmountData,
      tokenAmount,
      tokenList,
      tokenSymbol,
      totalAmount,
      transactionArguments,
      transactionWrapped,
      txAeFee,
      verifying,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.confirm-transaction-sign {
  .loader {
    display: flex;
    margin: 0 auto;
    width: 56px;
    height: 56px;
  }

  .subtitle {
    margin: 8px 0;
    color: variables.$color-grey-light;

    &.warning {
      color: variables.$color-warning;
    }

    .app-name {
      color: variables.$color-white;
    }
  }

  .transaction-overview {
    margin-bottom: 16px;
  }

  .reason:deep() {
    .value {
      word-break: break-all;
      color: variables.$color-warning;
    }
  }

  .details {
    @include mixins.flex(flex-start, flex-start, column);

    gap: 8px;
    padding: 8px 0;

    .details-item {
      margin-right: 24px;
    }
  }

  .pool-token-row:deep() {
    padding-bottom: 8px;
  }

  .button-action-primary {
    display: flex;
  }
}
</style>
