<template>
  <Modal
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

      <template v-if="(isDex || isAllowance) && tokenList.length">
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
          :label="$t(`pages.signTransaction.${swapDirection}`)"
        >
          <TokenAmount
            :amount="tokenAmount"
            :symbol="tokenSymbol"
            :aex9="isTransactionAex9(txWrapped)"
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
            :symbol="getTxSymbol(transaction)"
            :aex9="isTransactionAex9(txWrapped)"
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
          :value="transaction[key]"
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
        @click="resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  getCurrentInstance,
  onMounted,
  PropType,
  ref,
} from 'vue';
import { camelCase } from 'lodash-es';
import { useStore } from 'vuex';
import { RejectedByUserError } from '../../../lib/errors';
import {
  FUNCTION_TYPE_DEX,
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
import { useTransactionTx } from '../../../composables';
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
  props: {
    transaction: { type: Object as PropType<ITx>, required: true },
    resolve: { type: Function, required: true },
    reject: { type: Function as PropType<(e: Error) => void>, required: true },
  },
  setup(props) {
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();

    const {
      direction,
      isAllowance,
      isDex,
      setTransactionTx,
    } = useTransactionTx({
      store,
      tx: props.transaction,
    });

    const showAdvanced = ref(false);
    const tokenList = ref<ITokenResolved[]>([]);
    const txFunction = ref<TxFunctionRaw | undefined>();
    const loading = ref(false);

    const availableTokens = useState('fungibleTokens', 'availableTokens');
    const getTxSymbol = useGetter('getTxSymbol');
    const activeNetwork = useGetter('activeNetwork');
    const getTxAmountTotal = useGetter('getTxAmountTotal');

    const txWrapped = computed((): Partial<ITransaction> => ({ tx: props.transaction }));

    const isSwap = computed(
      () => txFunction.value && FUNCTION_TYPE_DEX.swap.includes(txFunction.value),
    );

    const isPool = computed(
      () => txFunction.value && FUNCTION_TYPE_DEX.pool.includes(txFunction.value),
    );

    const txAeFee = computed(() => getAeFee(props.transaction.fee));
    const nameAeFee = computed(() => getAeFee(props.transaction.nameFee));

    const swapDirection = computed(() => {
      if (txFunction.value) {
        if (FUNCTION_TYPE_DEX.maxSpent.includes(txFunction.value)) {
          return 'maxSpent';
        }
        if (FUNCTION_TYPE_DEX.minReceived.includes(txFunction.value)) {
          return 'minReceived';
        }
      }
      return 'total';
    });

    const totalAmount = computed(() => getTxAmountTotal.value(txWrapped.value, direction.value));

    const singleToken = computed((): ITokenResolved => ({
      isReceived: direction.value === TX_DIRECTION.received,
      amount: totalAmount.value,
      symbol: getTxSymbol.value(props.transaction),
    }));

    const filteredTxFields = computed(
      () => TX_FIELDS_TO_DISPLAY.filter((field) => !!props.transaction[field]),
    );

    const swapTokenAmountData = computed(
      (): ITokenResolved => swapDirection.value === 'maxSpent' ? tokenList.value[0] : tokenList.value[1],
    );

    const tokenAmount = computed((): number => +convertToken(
      swapTokenAmountData.value.amount as number,
      -(swapTokenAmountData.value.decimals as number),
    ));

    const tokenSymbol = computed(
      () => swapTokenAmountData.value.isAe ? AETERNITY_SYMBOL : swapTokenAmountData.value.symbol,
    );

    const completeTransaction = computed(
      () => ({ tx: { ...props.transaction, function: txFunction.value } }),
    );

    const isProvideLiquidity = computed(
      () => txFunction.value && DEX_TRANSACTION_TAGS[txFunction.value] === DEX_PROVIDE_LIQUIDITY,
    );

    function getTokens(txParams: ITx): ITokenResolved[] {
      if (!isDex.value && !isAllowance.value) {
        return [singleToken.value];
      }
      const functionName = camelCase(txParams.function) as TxFunctionParsed;
      const resolver = transactionTokenInfoResolvers[functionName];
      if (!resolver) {
        return [];
      }
      const tokens = resolver(
        { tx: { ...txParams, ...props.transaction } } as ITransaction,
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
      if (isAllowance.value) {
        return root.$t('pages.signTransaction.approveUseOfToken');
      }
      if (isSwap.value) {
        return !idx ? root.$t('pages.signTransaction.from') : root.$t('pages.signTransaction.to');
      }
      if (isPool.value && isProvideLiquidity.value) {
        return token.isPool ? '' : root.$t('pages.signTransaction.maximumDeposited');
      }
      if (
        isPool.value
        && txFunction.value
        && DEX_TRANSACTION_TAGS[txFunction.value] === DEX_REMOVE_LIQUIDITY
      ) {
        return token.isPool
          ? root.$t('pages.signTransaction.poolTokenSpent')
          : root.$t('pages.signTransaction.minimumWithdrawn');
      }
      return '';
    }

    function cancel() {
      props.reject(new RejectedByUserError());
    }

    onMounted(async () => {
      if (props.transaction.contractId) {
        try {
          loading.value = true;
          setTimeout(() => { loading.value = false; }, 20000);
          const { bytecode } = await fetchJson(
            `${activeNetwork.value.url}/v3/contracts/${props.transaction.contractId}/code`,
          );
          const txParams: ITx = await postJson(
            `${activeNetwork.value.compilerUrl}/decode-calldata/bytecode`,
            { body: { bytecode, calldata: props.transaction.callData } },
          );
          txFunction.value = txParams.function as TxFunctionRaw;

          setTransactionTx({ ...txParams, ...props.transaction });

          const allTokens = getTokens(txParams);

          tokenList.value = allTokens.map((token) => ({
            ...token,
            tokens: token.isPool && !isProvideLiquidity.value
              ? allTokens.filter((t) => !t.isPool).reverse()
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

    return {
      AETERNITY_SYMBOL,
      loading,
      showAdvanced,
      txWrapped,
      filteredTxFields,
      completeTransaction,
      tokenList,
      tokenAmount,
      tokenSymbol,
      totalAmount,
      swapDirection,
      isAllowance,
      isSwap,
      isDex,
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

  .pool-token-row::v-deep {
    padding-bottom: 8px;
  }
}
</style>
