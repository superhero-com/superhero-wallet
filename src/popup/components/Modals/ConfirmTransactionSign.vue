<template>
  <Modal
    full-screen
    class="confirm-transaction-sign"
    data-cy="popup-aex2"
  >
    <TransactionOverview :tx="completeTransaction" />

    <AnimatedSpinner
      v-if="loading"
      class="loader"
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
        <TokenAmount
          :amount="nameAeFee"
        />
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
        :label="$t('pages.signTransaction.total')"
      >
        <TokenAmount
          :amount="getTxAmountTotal(txWrapped)"
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
        :text="$t('pages.signTransaction.confirm')"
        @click="resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import {
  FUNCTION_TYPE_DEX,
  DEX_TRANSACTION_TAGS,
  DEX_PROVIDE_LIQUIDITY,
  DEX_REMOVE_LIQUIDITY,
  AETERNITY_SYMBOL,
  TX_FUNCTIONS,
  convertToken,
  isTransactionAex9,
  getAeFee,
} from '../../utils';
import type {
  ITokenResolved,
  ITransaction,
  ITx,
  TxFunctionParsed,
  TxFunctionRaw,
} from '../../../types';
import { transactionTokenInfoResolvers } from '../../utils/transactionTokenInfoResolvers';
import { useSdk } from '../../../composables';
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
    // eslint-disable-next-line no-unused-vars
    reject: { type: Function as PropType<(e: Error) => void>, required: true },
  },
  setup(props, { root }) {
    const { getSdk } = useSdk({ store: root.$store });

    const showAdvanced = ref(false);
    const tokenList = ref<ITokenResolved[]>([]);
    const txFunction = ref<TxFunctionRaw | undefined>();
    const loading = ref(false);

    const availableTokens = useState('fungibleTokens', 'availableTokens');
    const getTxSymbol = useGetter('getTxSymbol');
    const getTxAmountTotal = useGetter('getTxAmountTotal');
    const getDexContracts = useGetter('getDexContracts');
    const getTxDirection = useGetter('getTxDirection');

    const txWrapped = computed((): Partial<ITransaction> => ({ tx: props.transaction }));

    const isAllowance = computed(() => (
      txFunction.value
      && FUNCTION_TYPE_DEX.allowance.includes(txFunction.value)
    ));

    const isSwap = computed(
      () => txFunction.value && FUNCTION_TYPE_DEX.swap.includes(txFunction.value),
    );

    const isPool = computed(
      () => txFunction.value && FUNCTION_TYPE_DEX.pool.includes(txFunction.value),
    );

    const isDex = computed(() => (
      getDexContracts.value.router.includes(props.transaction?.contractId)
      || getDexContracts.value.wae.includes(props.transaction?.contractId)
      || isAllowance.value
    ));

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

    const singleToken = computed((): ITokenResolved => ({
      isReceived: getTxDirection.value(props.transaction) === TX_FUNCTIONS.received,
      amount: getTxAmountTotal.value(txWrapped.value),
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
      (): ITx => ({ ...props.transaction, function: txFunction.value }),
    );

    const isProvideLiquidity = computed(
      () => txFunction.value && DEX_TRANSACTION_TAGS[txFunction.value] === DEX_PROVIDE_LIQUIDITY,
    );

    function getTokens(txParams: ITx): ITokenResolved[] {
      if (!isDex.value) return [singleToken.value];
      const functionName = camelCase(txParams.function) as TxFunctionParsed;
      const resolver = transactionTokenInfoResolvers[functionName];
      if (!resolver) return [];
      const tokens = resolver(
        { tx: { ...txParams, ...props.transaction } } as ITransaction,
        availableTokens.value,
      )?.tokens;
      if (!isPool.value) return tokens;
      if (isProvideLiquidity.value) return tokens.filter((t) => !t.isPool);
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
      props.reject(new Error('Rejected by user'));
    }

    onMounted(async () => {
      if (props.transaction.contractId) {
        try {
          loading.value = true;
          setTimeout(() => { loading.value = false; }, 20000);
          const sdk = await getSdk();
          const { bytecode } = await sdk.getContractByteCode(props.transaction.contractId);
          const txParams: ITx = await sdk.compilerApi.decodeCalldataBytecode({
            bytecode,
            calldata: props.transaction.callData,
          });
          txFunction.value = txParams.function as TxFunctionRaw;
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
      getTxAmountTotal,
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
