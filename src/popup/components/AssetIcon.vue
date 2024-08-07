<template>
  <component
    :is="selectedIcon"
    v-if="selectedIcon"
    class="asset-icon"
    :class="[iconSize]"
    :title="asset?.name || asset?.symbol"
  />
  <img
    v-else
    class="asset-icon"
    :src="asset.image || getTokenPlaceholderUrl(asset!)"
    :class="[iconSize, { 'is-placeholder': !asset?.image }]"
    :title="asset?.name || asset?.symbol"
    alt="Asset image"
  >
</template>

<script lang="ts">
import {
  Component,
  computed,
  defineComponent,
  PropType,
} from 'vue';
import {
  AssetContractId,
  Dictionary,
  ITokenResolved,
  Protocol,
} from '@/types';
import { ICON_SIZES, PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AE_AVATAR_URL } from '@/protocols/aeternity/config';

import AeternityIcon from '@/icons/coin/aeternity.svg?vue-component';
import BitcoinIcon from '@/icons/coin/bitcoin.svg?vue-component';
import EthereumIcon from '@/icons/coin/ethereum.svg?vue-component';
import SolanaIcon from '@/icons/coin/solana.svg?vue-component';
import LexonTokenIcon from '@/icons/tokens/ct_xtk8rSz9suPb6D6VLquyfVji25FcnFRDjn3dnn5mmvHsPiESt.svg?vue-component';

const SIZES = [ICON_SIZES.sm, ICON_SIZES.rg, ICON_SIZES.md, ICON_SIZES.lg, ICON_SIZES.xxl] as const;

export type AllowedAssetIconSize = typeof SIZES[number];

const COIN_ICONS: Record<Protocol, Component> = {
  [PROTOCOLS.aeternity]: AeternityIcon,
  [PROTOCOLS.bitcoin]: BitcoinIcon,
  [PROTOCOLS.ethereum]: EthereumIcon,
  [PROTOCOLS.solana]: SolanaIcon,
};

const ASSET_ICONS: Dictionary<Component> = {
  ...COIN_ICONS,
  ct_xtk8rSz9suPb6D6VLquyfVji25FcnFRDjn3dnn5mmvHsPiESt: LexonTokenIcon,
};

export default defineComponent({
  props: {
    asset: {
      type: Object as PropType<ITokenResolved>,
      required: true,
    },
    iconSize: {
      type: String as PropType<AllowedAssetIconSize>,
      default: ICON_SIZES.md,
      validator: (val: AllowedAssetIconSize) => SIZES.includes(val),
    },
  },
  setup(props) {
    const protocol = computed(() => props.asset.protocol || PROTOCOLS.aeternity);
    const contractId = computed((): AssetContractId => (
      props.asset.contractId
      || ProtocolAdapterFactory.getAdapter(protocol.value).coinContractId
    ));
    const selectedIcon = computed(() => ASSET_ICONS[contractId.value]);

    function getTokenPlaceholderUrl(token: ITokenResolved) {
      // TODO Should not be protocol specific
      return `${AE_AVATAR_URL}${token.contractId}`;
    }

    return {
      selectedIcon,
      getTokenPlaceholderUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.asset-icon {
  --icon-size: var(--icon-size-md);

  display: inline-block;
  flex-grow: 0;
  flex-shrink: 0;
  width: var(--icon-size);
  height: var(--icon-size);
  border-radius: 50%;

  &.is-placeholder {
    border: 0.25px solid rgba($color-white, 0.75);
  }

  &.sm {
    --icon-size: var(--icon-size-sm);
  }

  &.rg {
    --icon-size: var(--icon-size-rg);
  }

  &.lg {
    --icon-size: var(--icon-size-lg);
  }

  &.xxl {
    --icon-size: var(--icon-size-xxl);
  }
}
</style>
