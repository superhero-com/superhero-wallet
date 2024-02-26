<template>
  <div
    v-if="tokenList.length > 1"
    class="swap-route"
  >
    <div class="title">
      {{ $t('pages.transactionDetails.swapRoute') }}
    </div>
    <div class="swap-wrapper">
      <span
        v-for="(token, idx) of tokenList"
        :key="idx"
        class="swap"
      >
        <span
          v-if="idx"
          class="divider"
        >
          <span class="space" />
          {{ checkWaeAeTx(idx - 1)
            ? 0 : `${(idx > 1 && checkWaeAeTx(idx - 2)) || idx === 1 ? '' : '<'}0.3` }}%
          {{ $t('pages.transactionDetails.poolFee') }}
          <span class="arrow">
            <ArrowHead />
          </span>
        </span>
        <Tokens :tokens="[token]" />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { camelCase } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';

import type {
  ITransaction,
  TxFunction,
  TxFunctionParsed,
  TxFunctionRaw,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { useAeSdk, useFungibleTokens } from '@/composables';
import { DEX_CONTRACTS } from '@/protocols/aeternity/config';
import { getTransactionTokenInfoResolver, isTxFunctionDexSwap } from '@/protocols/aeternity/helpers';

import Tokens from './Tokens.vue';
import ArrowHead from '../../icons/arrow-head.svg?vue-component';

export default defineComponent({
  components: {
    Tokens,
    ArrowHead,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props) {
    const { nodeNetworkId } = useAeSdk();
    const { getProtocolAvailableTokens } = useFungibleTokens();

    const aeTokensAvailable = computed(() => getProtocolAvailableTokens(PROTOCOLS.aeternity));

    function getTxFunction(
      functionName: TxFunctionRaw | TxFunctionParsed | TxFunction,
    ): TxFunctionParsed {
      return camelCase(functionName) as TxFunctionParsed;
    }

    const tokenList = computed(() => {
      const txFunction = getTxFunction(props.transaction.tx.function!);

      if (!isTxFunctionDexSwap(txFunction)) {
        return [];
      }
      const resolver = getTransactionTokenInfoResolver(txFunction);
      if (!resolver) {
        return [];
      }
      let { tokens } = resolver(props.transaction, aeTokensAvailable.value);
      const index = props.transaction.tx.arguments.findIndex(({ type }) => type === 'list');
      const waeContract = DEX_CONTRACTS[nodeNetworkId.value!]?.wae;
      const tokenLastIndex = tokens.length - 1;

      if (index >= 0 && props.transaction.tx.arguments[index].value.length > tokens.length) {
        tokens = [
          tokens[0],
          ...props.transaction.tx.arguments[index].value
            .slice(1, props.transaction.tx.arguments[index].value.length - 1)
            .map((element: any) => aeTokensAvailable.value[element.value]),
          tokens[1],
        ];
      }
      if (
        tokens[0].isAe
        && waeContract
        && !waeContract?.includes(tokens[1].contractId as Encoded.ContractAddress)
      ) {
        tokens.unshift({
          ...tokens[0],
          isAe: true,
        });
        tokens[1].isAe = false;
      }
      if (
        tokens[tokenLastIndex].isAe && waeContract
        && !waeContract?.includes(tokens[tokenLastIndex - 1].contractId as Encoded.ContractAddress)
      ) {
        tokens[tokenLastIndex].isAe = false;
        tokens.push({ ...tokens[tokenLastIndex], isAe: true });
      }
      return tokens;
    });

    function checkWaeAeTx(idx: number) {
      if (idx === tokenList.value.length - 1) {
        return false;
      }
      const contracts = DEX_CONTRACTS[nodeNetworkId.value!];

      return (
        contracts?.wae?.includes(tokenList.value[idx].contractId as Encoded.ContractAddress)
        && tokenList.value[idx + 1].isAe
      ) || (
        contracts?.wae?.includes(tokenList.value[idx + 1].contractId as Encoded.ContractAddress)
        && tokenList.value[idx].isAe
      );
    }

    return {
      tokenList,
      checkWaeAeTx,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.swap-route {
  width: 100%;
  overflow: hidden;

  .title {
    color: variables.$color-grey-dark;
    padding-bottom: 8px;

    @extend %face-sans-14-medium;
  }

  .swap-wrapper {
    @include mixins.flex(flex-start, flex-start, row);

    flex-wrap: wrap;
    row-gap: 4px;

    :last-of-type {
      flex: 1;

      .tokens:deep() {
        width: 100%;
      }
    }
  }

  .swap {
    @include mixins.flex(flex-start, center, row);

    flex: 0;
    position: relative;
    height: 24px;

    .divider,
    .tokens:deep() {
      background: variables.$color-bg-4;
      z-index: 1;
      padding-right: 4px;
    }

    &::before {
      content: "";
      background-image: linear-gradient(variables.$color-white 2px, transparent 1px);
      position: absolute;
      top: calc(50% - 1px);
      height: 24px;
      width: 100vh;
    }

    .divider {
      @extend %face-sans-13-medium;

      @include mixins.flex(center, center, row);

      gap: 2px;
      color: variables.$color-white;
      white-space: nowrap;

      .space,
      .arrow {
        background-image: linear-gradient(variables.$color-white 2px, transparent 1px);
        width: 12px;
        height: 24px;
        transform: translateY(calc(50% - 1px));
        position: relative;
      }

      .arrow {
        margin-right: 4px;

        svg {
          position: absolute;
          transform: translateY(-5px);
          left: 7px;
          width: 9px;
          height: 12px;
        }
      }
    }
  }
}
</style>
