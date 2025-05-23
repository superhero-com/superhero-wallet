<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="auction-history">
        <span class="title">
          {{ $t('pages.names.auctions.bids-on') }}
          <span class="name">{{ name }}</span>
        </span>
        <div class="item">
          <AccountItem
            :address="highestBid.accountId"
            :name="getName(highestBid.accountId).value"
            :protocol="protocol"
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
            :protocol="protocol"
          />
          <AccountItem
            :protocol="protocol"
            :address="bid.accountId"
            :name="getName(bid.accountId).value"
            class="account-item"
          />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { defineComponent, computed } from 'vue';
import { isEqual } from 'lodash-es';

import { PROTOCOLS } from '@/constants';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

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
    const { getNameAuctionHighestBid, getNameAuction, getName } = useAeNames();

    const highestBid = computed(() => getNameAuctionHighestBid(props.name));

    const previousBids = computed(
      () => getNameAuction(props.name).bids.filter((bid) => !isEqual(bid, highestBid.value)),
    );

    return {
      protocol: PROTOCOLS.aeternity,
      getName,
      highestBid,
      previousBids,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.auction-history {
  min-height: 184px;
  background-image: url('../../../icons/squares-bg.svg');
  background-repeat: repeat-x;

  .title {
    @extend %face-sans-16-semi-bold;

    padding: 16px 0 8px 0;
    text-align: center;
    color: $color-grey-dark;
    display: block;

    .name {
      color: $color-primary;
    }
  }

  .item {
    margin: 0 16px;
    padding: 8px 0;

    &:not(:first-of-type) {
      border-top: 1px solid rgba($color-primary, 0.44);
      display: flex;
      justify-content: space-between;
    }

    .account-item :deep(.name) {
      max-width: 150px;
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
