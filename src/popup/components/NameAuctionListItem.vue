<template>
  <ListItemWrapper
    :to="to"
    replace
    class="name-auction-list-item"
  >
    <div class="content">
      <div class="name">
        {{ auction.name }}
        <TokenAmount
          :amount="getAeFee(auction.lastBid.nameFee)"
          :protocol="PROTOCOLS.aeternity"
        />
      </div>
      <div
        v-if="topBlockHeight"
        class="expiration"
        v-text="$t(
          'pages.names.auctions.endsInApproxTime',
          { time: blocksToRelativeTime(auction.expiration - topBlockHeight) },
        )"
      />
    </div>
  </ListItemWrapper>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { RouteLocationNamedRaw } from 'vue-router';

import { PROTOCOLS } from '@/constants';
import { blocksToRelativeTime } from '@/utils';
import type { INameAuction } from '@/protocols/aeternity/types';
import { getAeFee } from '@/protocols/aeternity/helpers';

import TokenAmount from '@/popup/components/TokenAmount.vue';
import ListItemWrapper from '@/popup/components/ListItemWrapper.vue';

export default defineComponent({
  components: {
    ListItemWrapper,
    TokenAmount,
  },
  props: {
    auction: { type: Object as PropType<INameAuction>, required: true },
    to: { type: Object as PropType<RouteLocationNamedRaw>, default: null },
    topBlockHeight: { type: Number, default: null },
  },
  setup() {
    return {
      PROTOCOLS,
      blocksToRelativeTime,
      getAeFee,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.name-auction-list-item {
  @extend %face-sans-14-medium;

  padding-inline: var(--screen-padding-x);

  .content {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    color: $color-white;
    text-align: left;
    text-decoration: none;
    transition: 0.2s;
  }

  .name {
    display: flex;
    flex-direction: column;
    font-weight: bold;
  }

  .expiration {
    user-select: none;
    color: $color-grey-dark;
  }
}
</style>
