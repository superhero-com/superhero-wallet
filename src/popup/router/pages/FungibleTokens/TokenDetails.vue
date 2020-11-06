<template>
  <div class="token-details">
    <div class="token-header">
      <div class="token-profile">
        <Avatar
          v-if="tokenData.contract || tokenData.image"
          :address="tokenData.contract"
          :src="tokenData.image || null"
          size="xlg"
        />
        <div class="amount">
          <span class="text-ellipsis max-space" :title="tokenData.convertedBalance || '0.00'">{{
            tokenData.convertedBalance || '0.00'
          }}</span>
          <span class="symbol text-ellipsis max-space" :title="tokenData.symbol">{{
            tokenData.symbol
          }}</span>
          <FormatFiatCurrency
            class="text-ellipsis max-space"
            :balance="tokenData.balanceCurrency"
          />
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
      <DetailsRow :label="$t('pages.token-details.symbol')" :text="tokenData.symbol" />
      <DetailsRow
        :class="{ community: tokenData.community }"
        :label="$t('pages.token-details.community')"
      />
      <DetailsRow :label="$t('pages.token-details.decimals')" :text="tokenData.decimals" />
      <DetailsRow
        v-if="tokenData.contract"
        :class="{ contract: tokenData.contract }"
        :label="$t('pages.token-details.contract')"
        :text="tokenData.contract"
      />
      <DetailsRow
        :label="$t('pages.token-details.available-supply')"
        :text="tokenData.circulating_supply"
      />
      <DetailsRow :label="$t('pages.token-details.total-supply')" :text="tokenData.total_supply" />
      <DetailsRow :label="$t('pages.token-details.max-supply')" :text="tokenData.max_supply" />
      <DetailsRow :label="$t('pages.token-details.price-ae')" />
      <DetailsRow
        :label="$t('pages.token-details.price')"
        :text="tokenData.current_price ? formatCurrency(tokenData.current_price) : ''"
      />
      <DetailsRow :label="$t('pages.token-details.volume')" :text="tokenData.total_volume" />
      <DetailsRow :label="$t('pages.token-details.market-cap')" :text="tokenData.market_cap" />
      <DetailsRow :label="$t('pages.token-details.ath-change')" :text="tokenData.ath" />
      <DetailsRow :label="$t('pages.token-details.atl-change')" :text="tokenData.atl" />
      <DetailsRow :label="$t('pages.token-details.chart')" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
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
  props: {
    id: { type: String, required: true },
  },
  data() {
    return {
      activeTab: 'details',
      tabs: [
        {
          name: 'details',
          text: this.$t('pages.token-details.details'),
        },
      ],
    };
  },
  created() {
    this.$store.commit(
      'setPageTitle',
      this.availableTokens[this.id] ? this.availableTokens[this.id].name : 'Aeternity',
    );
  },
  computed: {
    ...mapGetters(['tippingSupported', 'formatCurrency', 'tokenBalance', 'balanceCurrency']),
    ...mapState('fungibleTokens', ['tokenBalances', 'availableTokens', 'aePublicData']),
    tokenData() {
      if (this.id === 'aeternity') {
        return {
          ...this.aePublicData,
          symbol: 'AE',
          convertedBalance: this.tokenBalance,
          balanceCurrency: this.balanceCurrency,
          contract: '',
        };
      }
      return (
        this.tokenBalances.find(({ contract }) => contract === this.id) || {
          ...this.availableTokens[this.id],
          contract: this.id,
        }
      );
    },
  },
  destroyed() {
    this.$store.commit('setPageTitle', '');
  },
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
