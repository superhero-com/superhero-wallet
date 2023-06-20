<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="auction-history">
        <span class="title">
          {{ $t('pages.names.auctions.bids-on') }}
          <span class="name">{{ name }}</span>
        </span>
        <div class="item">
          <AccountItem
            :address="highestBid.accountId"
            :name="getPreferred(highestBid.accountId)"
            :protocol="PROTOCOL_AETERNITY"
          />
          <AuctionOverview :name="name" />
        </div>
        <div
          v-for="(bid, index) in previousBids"
          :key="index"
          class="item"
        >
          <TokenAmount
            :amount="+bid.nameFee"
            :protocol="PROTOCOL_AETERNITY"
          />
          <AccountItem
            :protocol="PROTOCOL_AETERNITY"
            :address="bid.accountId"
            :name="getPreferred(bid.accountId)"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { defineComponent, computed } from 'vue';
import type { IAuctionBid } from '@/types';
import { useGetter } from '@/composables/vuex';
import { PROTOCOL_AETERNITY } from '@/constants';
import AccountItem from '../../components/AccountItem.vue';
import AuctionOverview from '../../components/AuctionOverview.vue';
import TokenAmount from '../../components/TokenAmount.vue';

export default defineComponent({
  components: {
    AccountItem,
    AuctionOverview,
    TokenAmount,
    IonPage,
    IonContent,
  },
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    const getHighestBid = useGetter('names/getHighestBid');
    const getAuction = useGetter('names/getAuction');
    const getPreferred = useGetter('names/getPreferred');

    const highestBid = computed(() => getHighestBid.value(props.name));

    const previousBids = computed(
      () => (getAuction.value(props.name).bids)
        .filter((bid: IAuctionBid) => bid !== highestBid.value),
    );

    return {
      PROTOCOL_AETERNITY,
      getPreferred,
      highestBid,
      previousBids,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.auction-history {
  min-height: 184px;
  background-image: url('../../../icons/squares-bg.svg');
  background-repeat: repeat-x;

  .title {
    padding: 16px 0 8px 0;
    text-align: center;
    color: variables.$color-grey-dark;
    display: block;

    @extend %face-sans-17-medium;

    .name {
      color: variables.$color-primary;
    }
  }

  .item {
    margin: 0 16px;
    padding: 8px 0;

    &:not(:first-of-type) {
      border-top: 1px solid rgba(variables.$color-primary, 0.44);
    }

    .account-item {
      margin-top: 4px;
    }

    .auction-overview {
      margin-top: 16px;

      :deep(.details-item:first-of-type) {
        padding-right: 32px;
      }
    }
  }
}
</style>
