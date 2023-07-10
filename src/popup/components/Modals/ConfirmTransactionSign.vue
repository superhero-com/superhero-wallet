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
          <TokenAmount :amount="nameAeFee" />
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
            data-cy="total"
          />
        </DetailsItem>

        <DetailsItem :label="$t('transaction.fee')">
          <TokenAmount
            :amount="txAeFee"
            data-cy="fee"
          />
        </DetailsItem>

        <DetailsItem
          v-if="!isDex"
          :label="$t('common.total')"
        >
          <TokenAmount
            :amount="totalAmount"
            :symbol="getTxSymbol(popupProps?.tx)"
            :aex9="isTransactionAex9(transactionWrapped)"
            data-cy="total"
          />
        </DetailsItem>
      </div>

      <DetailsItem
        expandable
        :label="$t('transaction.advancedDetails')"
      >
        <DetailsItem
          v-for="key in filteredTxFields"
          :key="key"
          :label="$t('modals.confirmTransactionSign')[key]"
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
        data-cy="accept"
        third
        :text="$t('common.confirm')"
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
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { RejectedByUserError } from '../../../lib/errors';
import {
  TX_FUNCTION_TYPE_DEX,
  DEX_TRANSACTION_TAGS,
  DEX_PROVIDE_LIQUIDITY,
  DEX_REMOVE_LIQUIDITY,
  AETERNITY_SYMBOL,
  TX_DIRECTION,
  convertToken,
  isTransactionAex9,
  getAeFee,
  fetchJson,
  postJson,
} from '../../utils';
import type {
  ITokenResolved,
  ITransaction,
  ITx,
  TxFunctionParsed,
  TxFunctionRaw,
} from '../../../types';
import { transactionTokenInfoResolvers } from '../../utils/transactionTokenInfoResolvers';
import { usePopupProps, useSdk, useTransactionTx } from '../../../composables';
import { useGetter, useState } from '../../../composables/vuex';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TransactionOverview from '../TransactionOverview.vue';
import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import TransactionDetailsPoolTokenRow from '../TransactionDetailsPoolTokenRow.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';

type ITxKey = keyof ITx;

const TX_FIELDS_TO_DISPLAY: ITxKey[] = [
  'callData',
  'code',
  'contractId',
  'commitmentId',
  'name',
  'nameFee',
  'nameSalt',
  'nameId',
  'nonce',
  'payload',
  'pointers',
  'recipientId',
];

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
    const store = useStore();
    const { t } = useI18n();
    const { getSdk } = useSdk({ store });

    const { popupProps, setPopupProps } = usePopupProps();

    const {
      direction,
      isDexAllowance,
      isDex,
      setTransactionTx,
    } = useTransactionTx({
      store,
      tx: popupProps.value?.tx as ITx,
    });

    const showAdvanced = ref(false);
    const tokenList = ref<ITokenResolved[]>([]);
    const txFunction = ref<TxFunctionRaw | undefined>();
    const loading = ref(false);

    const availableTokens = useState('fungibleTokens', 'availableTokens');
    const getTxSymbol = useGetter('getTxSymbol');
    const activeNetwork = useGetter('activeNetwork');
    const getTxAmountTotal = useGetter('getTxAmountTotal');

    const transactionWrapped = computed(
      (): Partial<ITransaction> => ({ tx: popupProps.value?.tx as ITx }),
    );

    const isSwap = computed(
      () => txFunction.value && TX_FUNCTION_TYPE_DEX.swap.includes(txFunction.value),
    );

    const isPool = computed(
      () => txFunction.value && TX_FUNCTION_TYPE_DEX.pool.includes(txFunction.value),
    );

    const txAeFee = computed(() => getAeFee(popupProps.value?.tx?.fee!));
    const nameAeFee = computed(() => getAeFee(popupProps.value?.tx?.nameFee!));

    const swapDirection = computed(() => {
      if (txFunction.value) {
        if (TX_FUNCTION_TYPE_DEX.maxSpent.includes(txFunction.value)) {
          return 'maxSpent';
        }
        if (TX_FUNCTION_TYPE_DEX.minReceived.includes(txFunction.value)) {
          return 'minReceived';
        }
      }
      return 'total';
    });

    const swapDirectionTranslation = computed(() => {
      switch (swapDirection.value) {
        case 'maxSpent': return t('pages.signTransaction.maxSpent');
        case 'minReceived': return t('pages.signTransaction.minReceived');
        default: return t('pages.signTransaction.total');
      }
    });

    const totalAmount = computed(
      () => getTxAmountTotal.value(transactionWrapped.value, direction.value),
    );

    const singleToken = computed((): ITokenResolved => ({
      isReceived: direction.value === TX_DIRECTION.received,
      amount: totalAmount.value,
      symbol: getTxSymbol.value(popupProps.value?.tx),
    }));

    const filteredTxFields = computed(
      () => TX_FIELDS_TO_DISPLAY.filter((field) => !!popupProps.value?.tx?.[field]),
    );

    const swapTokenAmountData = computed((): ITokenResolved => {
      const token = swapDirection.value === 'maxSpent' ? tokenList.value[0] : tokenList.value[1];
      return token || {};
    });

    const tokenAmount = computed((): number => +convertToken(
      swapTokenAmountData.value.amount || 0,
      -(swapTokenAmountData.value.decimals || 0),
    ));

    const tokenSymbol = computed(
      () => swapTokenAmountData.value.isAe ? AETERNITY_SYMBOL : swapTokenAmountData.value.symbol,
    );

    const completeTransaction = computed(
      () => ({ tx: { ...popupProps.value?.tx, function: txFunction.value } }),
    );

    const isProvideLiquidity = computed(
      () => txFunction.value && DEX_TRANSACTION_TAGS[txFunction.value] === DEX_PROVIDE_LIQUIDITY,
    );

    function getTokens(txParams: ITx): ITokenResolved[] {
      if (!isDex.value && !isDexAllowance.value) {
        return [singleToken.value];
      }
      const functionName = camelCase(txParams.function) as TxFunctionParsed;
      const resolver = transactionTokenInfoResolvers[functionName];
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

    onMounted(async () => {
      if (popupProps.value?.tx?.contractId) {
        try {
          loading.value = true;
          setTimeout(() => { loading.value = false; }, 20000);

          const [
            { bytecode },
          ] = await Promise.all([
            fetchJson(`${activeNetwork.value.url}/v3/contracts/${popupProps.value.tx.contractId}/code`),
            // SDK is needed to establish the `networkId` and the dex contracts for the network
            getSdk(),
          ]);

          const txParams: ITx = await postJson(
            `${activeNetwork.value.compilerUrl}/decode-calldata/bytecode`,
            { body: { bytecode, calldata: popupProps.value.tx.callData } },
          );
          txFunction.value = txParams.function as TxFunctionRaw;

          setTransactionTx({ ...txParams, ...popupProps.value.tx });

          const allTokens = getTokens(txParams);

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
    });

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      AETERNITY_SYMBOL,
      loading,
      showAdvanced,
      transactionWrapped,
      popupProps,
      filteredTxFields,
      completeTransaction,
      tokenList,
      tokenAmount,
      tokenSymbol,
      totalAmount,
      swapDirection,
      swapDirectionTranslation,
      isSwap,
      isDex,
      isDexAllowance,
      isHash,
      isTransactionAex9,
      swapTokenAmountData,
      getTxSymbol,
      txAeFee,
      nameAeFee,
      getLabels,
      cancel,
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

  .transaction-overview {
    margin-bottom: 16px;
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
}
</style>
