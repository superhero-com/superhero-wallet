<template>
  <DetailsItem
    v-if="assetList.length > 1"
    class="swap-route"
    :label="$t('pages.transactionDetails.swapRoute')"
  >
    <div class="swap-steps">
      <span
        v-for="(asset, idx) of assetList"
        :key="idx"
        class="swap-steps-item"
      >
        <span
          v-if="idx"
          class="step-fee"
        >
          <span class="line" />
          {{ getSwapStepFee(idx) }}%
          {{ $t('pages.transactionDetails.poolFee') }}
          <span class="arrow" />
        </span>

        <Tokens :tokens="[asset]" />
      </span>
    </div>
  </DetailsItem>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  toRef,
} from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';

import type {
  ITokenResolved,
  ITransaction,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAeSdk, useFungibleTokens, useTransactionData } from '@/composables';
import { DEX_CONTRACTS } from '@/protocols/aeternity/config';
import { getTransactionTokenInfoResolver, isTxFunctionDexSwap } from '@/protocols/aeternity/helpers';

import DetailsItem from './DetailsItem.vue';
import Tokens from './Tokens.vue';

export default defineComponent({
  components: {
    DetailsItem,
    Tokens,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props) {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);

    const { nodeNetworkId } = useAeSdk();
    const { getProtocolAvailableTokens } = useFungibleTokens();
    const { txFunctionParsed, txFunctionRaw } = useTransactionData({
      transaction: toRef(() => props.transaction),
    });

    const aeTokensAvailable = computed(() => getProtocolAvailableTokens(PROTOCOLS.aeternity));

    // TODO replace with `transactionTokens` taken from `transactionData` composable
    const assetList = computed(() => {
      if (!isTxFunctionDexSwap(txFunctionRaw.value)) {
        return [];
      }
      const resolver = getTransactionTokenInfoResolver(txFunctionParsed.value!);
      if (!resolver) {
        return [];
      }
      let { tokens } = resolver(props.transaction, aeTokensAvailable.value);
      const args = props.transaction.tx.arguments || [];
      const index = args.findIndex(({ type }) => type === 'list');
      const waeContract = DEX_CONTRACTS[nodeNetworkId.value!]?.wae;
      const tokenLastIndex = tokens.length - 1;

      if (index >= 0 && args[index].value.length > tokens.length) {
        tokens = [
          tokens[0],
          ...args[index].value
            .slice(1, args[index].value.length - 1)
            .map((element: any) => aeTokensAvailable.value[element.value]),
          tokens[1],
        ];
      }

      // If swapping coin into token (or opposite) there is an additional step of swapping the coin
      // into wrapped coin token. Here we are prepending or appending the asset list to indicate it.
      if (
        tokens[0].isWrappedCoin
        && !waeContract?.includes(tokens[1].contractId as Encoded.ContractAddress)
      ) {
        tokens[0].isWrappedCoin = false;
        tokens.unshift({
          ...tokens[0],
          ...adapter.getDefaultCoin(),
          isWrappedCoin: false,
        });
      } else if (
        tokens[tokenLastIndex].isWrappedCoin
        && !waeContract?.includes(tokens[tokenLastIndex - 1].contractId as Encoded.ContractAddress)
      ) {
        tokens[tokenLastIndex].isWrappedCoin = false;
        tokens.push({
          ...tokens[tokenLastIndex],
          ...adapter.getDefaultCoin(),
          isWrappedCoin: true,
        });
      }
      return tokens;
    });

    function isAssetWrappedCoin(asset: ITokenResolved): boolean {
      return (
        !!asset.contractId
        && DEX_CONTRACTS[nodeNetworkId.value!]?.wae?.includes(asset.contractId)
      );
    }

    function getSwapStepFee(idx: number): string {
      const sourceAsset = assetList.value[idx - 1];
      const destAsset = assetList.value[idx];

      // Exchanging the coin to token first requires to swap it to wrapped coin token.
      // This operation is free (no fee involved)
      if (
        sourceAsset.contractId === adapter.coinContractId
        || destAsset.contractId === adapter.coinContractId
      ) {
        return '0';
      }

      // Transactions involving wrapped coin
      if (isAssetWrappedCoin(sourceAsset) || isAssetWrappedCoin(destAsset)) {
        return '0.3';
      }

      // Other transactions
      return '<0.3';
    }

    return {
      assetList,
      getSwapStepFee,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.swap-route {
  .swap-steps {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 2px;
    overflow: hidden;

    .swap-steps-item {
      position: relative;
      display: flex;
      gap: 4px;
      align-items: center;
      height: 24px;

      .step-fee {
        @extend %face-sans-13-medium;

        display: flex;
        align-items: center;
        gap: 2px;
        padding: 3px 5px;
        border-radius: 20px;
        color: variables.$color-white;
        background: variables.$color-bg-3;
        white-space: nowrap;
      }
    }
  }

  .line,
  .arrow {
    display: inline-flex;
    align-items: center;
    position: relative;
    margin-inline: 1px;
    min-width: 10px;
    height: 100%;
    opacity: 0.3;

    &::before {
      content: '';
      position: absolute;
      top: calc(50% - 1px);
      width: 100%;
      height: 2px;
      background-color: variables.$color-white;
      transform: scaleY(0.8); // Make the line thinner
    }
  }

  .arrow {
    justify-content: end;
    width: 100%;
    min-width: 12px;

    // Arrowhead
    &::after {
      content: '';
      display: block;
      width: 6px;
      height: 6px;
      border-style: solid;
      border-color: variables.$color-white;
      border-width: 2px 2px 0 0;
      border-radius: 1px;
      transform: rotate(45deg);
    }
  }
}
</style>
