<template>
  <div class="token-details">
    <div class="token-header">
      <div class="token-profile">
        <Avatar :address="data.contract" :src="data.image || null" size="xlg" />
        <div class="amount">
          <span class="text-ellipsis max-space" :title="data.convertedBalance || '0.00'">{{
            data.convertedBalance || '0.00'
          }}</span>
          <span class="symbol text-ellipsis max-space" :title="data.symbol">{{ data.symbol }}</span>
          <FormatFiatCurrency class="text-ellipsis max-space" :balance="data.balanceCurrency" />
        </div>
      </div>
      <div class="token-actions">
        <Button bold :to="{ name: 'send' }">
          {{ $t('pages.token-details.send') }}
        </Button>
        <Button bold to="/receive">
          {{ $t('pages.token-details.receive') }}
        </Button>
        <Button bold :disabled="!tippingSupported" :to="{ name: 'tip' }">
          {{ $t('pages.token-details.tip') }}
        </Button>
      </div>
    </div>
    <TabsMenu v-model="activeTab" :tabOptions="tabs" />
    <div class="token-info">
      <div class="section-title">
        {{ $t('pages.token-details.token-details') }}
      </div>
      <DetailsRow :label="$t('pages.token-details.symbol')" :text="data.symbol" />
      <DetailsRow
        :class="{ community: data.community }"
        :label="$t('pages.token-details.community')"
      />
      <DetailsRow :label="$t('pages.token-details.decimals')" :text="data.decimals" key="" />
      <DetailsRow
        v-if="data.contract"
        :class="{ contract: data.contract }"
        :label="$t('pages.token-details.contract')"
        :text="data.contract"
      />
      <DetailsRow
        :label="$t('pages.token-details.available-supply')"
        :text="data.circulating_supply"
      />
      <DetailsRow :label="$t('pages.token-details.total-supply')" :text="data.total_supply" />
      <DetailsRow :label="$t('pages.token-details.max-supply')" :text="data.max_supply" />
      <DetailsRow :label="$t('pages.token-details.price-ae')" />
      <DetailsRow
        :label="$t('pages.token-details.price')"
        :text="data.current_price ? formatCurrency(data.current_price) : ''"
      />
      <DetailsRow :label="$t('pages.token-details.volume')" :text="data.total_volume" />
      <DetailsRow :label="$t('pages.token-details.market-cap')" :text="data.market_cap" />
      <DetailsRow :label="$t('pages.token-details.ath-change')" :text="data.ath" />
      <DetailsRow :label="$t('pages.token-details.atl-change')" :text="data.atl" />
      <DetailsRow :label="$t('pages.token-details.chart')" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import TabsMenu from '../../components/TabsMenu';
import Avatar from '../../components/Avatar';
import FormatFiatCurrency from '../../components/FormatFiatCurrency';
import DetailsRow from '../../components/FungibleTokens/DetailsRow';
import Button from '../../components/Button';

export default {
  components: {
    Avatar,
    TabsMenu,
    FormatFiatCurrency,
    Button,
    DetailsRow,
  },
  data() {
    return {
      data: this.$route.params.data,
      activeTab: 'details',
      tabs: [
        {
          name: 'details',
          text: this.$t('pages.token-details.details'),
        },
      ],
    };
  },
  computed: mapGetters(['tippingSupported', 'formatCurrency']),
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';

.token-details {
  max-width: 357px;
  margin: 0 auto;
}

.token-header {
  background-color: $black-1;
  padding: 20px 30px;
}

.token-profile {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.amount {
  font-size: 18px;
  color: $white-1;
  margin-left: 10px;

  .symbol {
    color: $secondary-color;
  }

  .max-space {
    display: inline-block;
    max-width: 100px;
  }

  .format-fiat-currency {
    font-size: 16px;
    display: block;
  }
}

.token-actions {
  display: flex;
  align-items: center;

  .primary-button {
    width: auto;
    padding: 0 25px;
    display: inline-block;
  }
}

.section-title {
  color: $gray-1;
  font-weight: 500;
  font-size: 15px;
  padding: 12px 15px;
  background-color: $black-2;
}

.token-info > div:nth-child(odd) {
  background-color: $black-2;
}

.contract /deep/.text,
.community /deep/.text {
  color: $accent-color;
}

.contract /deep/.text {
  font-size: 9px;
  display: flex;
  align-items: center;
}

.community /deep/.text {
  font-size: 13px;
}
</style>
