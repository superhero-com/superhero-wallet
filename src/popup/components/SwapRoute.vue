<template>
  <div
    v-if="tokens.length > 1"
    class="swap-route"
  >
    <div class="title">
      {{ $t('pages.transactionDetails.swapRoute') }}
    </div>
    <div class="swap-wrapper">
      <span
        v-for="(token, idx) of tokens"
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
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import Tokens from './Tokens.vue';
import { transactionTokenInfoResolvers } from '../utils/transactionTokenInfoResolvers';
import { DEX_CONTRACTS, FUNCTION_TYPE_DEX } from '../utils/constants';
import ArrowHead from '../../icons/arrow-head.svg?vue-component';
import type {
  INetwork,
  ITransaction,
  TxFunctionParsed,
  TxFunctionRaw,
} from '../../types';
import { useGetter } from '../../composables/vuex';
import { useFungibleTokens } from '../../composables';

export default defineComponent({
  components: {
    Tokens,
    ArrowHead,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props, { root }) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const { availableTokens } = useFungibleTokens({ store: root.$store });

    const tokens = computed(() => {
      if (
        !FUNCTION_TYPE_DEX.swap.includes(props.transaction.tx.function as TxFunctionRaw)
      ) {
        return [];
      }
      const functionName = camelCase(props.transaction.tx.function) as TxFunctionParsed;
      const resolver = transactionTokenInfoResolvers[functionName];
      if (!resolver) {
        return [];
      }
      let { tokens: newTokens } = resolver(props.transaction, availableTokens.value);
      const index = props.transaction.tx.arguments.findIndex(({ type }: any) => type === 'list');
      if (index >= 0 && props.transaction.tx.arguments[index].value.length > newTokens.length) {
        newTokens = [
          newTokens[0],
          ...props.transaction.tx.arguments[index].value
            .slice(1, props.transaction.tx.arguments[index].value.length - 1)
            .map(({ value }: any) => availableTokens.value[value]),
          newTokens[1],
        ];
      }
      const waeContract = DEX_CONTRACTS[activeNetwork.value.networkId]?.wae;
      if (
        newTokens[0].isAe
        && waeContract
        && newTokens[1].contractId
        && !waeContract?.includes(newTokens[1].contractId)
      ) {
        newTokens.unshift({
          ...newTokens[0],
          isAe: true,
        });
        newTokens[1].isAe = false;
      }
      if (
        newTokens[newTokens.length - 1].isAe
        && waeContract
        && !waeContract?.includes(newTokens[newTokens.length - 2].contractId as string)
      ) {
        newTokens[newTokens.length - 1].isAe = false;
        newTokens.push({ ...newTokens[newTokens.length - 1], isAe: true });
      }
      return newTokens;
    });

    function checkWaeAeTx(idx: number) {
      if (idx === tokens.value.length - 1) {
        return false;
      }
      const contracts = DEX_CONTRACTS[activeNetwork.value.networkId];
      const [firstToken, secondToken] = tokens.value;
      return (
        (
          contracts?.wae?.includes(firstToken.contractId as string)
          && secondToken.isAe
        )
        || (
          contracts?.wae?.includes(secondToken.contractId as string)
          && firstToken.isAe
        )
      );
    }

    return {
      tokens,
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

      .tokens::v-deep {
        width: 100%;
      }
    }
  }

  .swap {
    @include mixins.flex(flex-start, center, row);

    flex: 0;
    position: relative;

    .divider,
    .tokens::v-deep {
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
