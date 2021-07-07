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
        <TokenAmount
          :amount="+tokenData.convertedBalance || 0"
          :symbol="tokenData.symbol"
        />
      </div>
      <div class="token-actions">
        <Button
          bold
          :to="{ name: 'transfer-send' }"
        >
          {{ $t('pages.token-details.send') }}
        </Button>
        <Button
          bold
          :to="{ name: 'transfer-receive' }"
        >
          {{ $t('pages.token-details.receive') }}
        </Button>
        <Button
          bold
          :disabled="!tippingSupported"
          :to="{ name: 'tips-send' }"
        >
          {{ $t('pages.token-details.tip') }}
        </Button>
      </div>
    </div>
    <TabsMenu
      v-model="activeTab"
      :tab-options="tabs"
    />
    <div class="token-info">
      <div class="section-title">
        {{ $t('pages.token-details.token-details') }}
      </div>
      <DetailsRow
        :label="$t('pages.token-details.symbol')"
        :text="tokenData.symbol"
      />
      <DetailsRow
        :class="{ community: tokenData.community }"
        :label="$t('pages.token-details.community')"
      />
      <DetailsRow
        :label="$t('pages.token-details.decimals')"
        :text="tokenData.decimals"
      />
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
      <DetailsRow
        :label="$t('pages.token-details.total-supply')"
        :text="tokenData.total_supply"
      />
      <DetailsRow
        :label="$t('pages.token-details.max-supply')"
        :text="tokenData.max_supply"
      />
      <DetailsRow :label="$t('pages.token-details.price-ae')" />
      <DetailsRow
        :label="$t('pages.token-details.price')"
        :text="tokenData.current_price ? formatCurrency(tokenData.current_price) : ''"
      />
      <DetailsRow
        :label="$t('pages.token-details.volume')"
        :text="tokenData.total_volume"
      />
      <DetailsRow
        :label="$t('pages.token-details.market-cap')"
        :text="tokenData.market_cap"
      />
      <DetailsRow
        :label="$t('pages.token-details.ath-change')"
        :text="tokenData.ath"
      />
      <DetailsRow
        :label="$t('pages.token-details.atl-change')"
        :text="tokenData.atl"
      />
      <DetailsRow :label="$t('pages.token-details.chart')" />
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import TabsMenu from '../../components/TabsMenu';
import Avatar from '../../components/Avatar';
import TokenAmount from '../../components/TokenAmount';
import DetailsRow from '../../components/FungibleTokens/DetailsRow';
import Button from '../../components/Button';

export default {
  components: {
    Avatar,
    TabsMenu,
    TokenAmount,
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
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance', 'balanceCurrency']);
  },
  computed: {
    ...mapGetters(['tippingSupported', 'formatCurrency']),
    ...mapState('fungibleTokens', ['aePublicData', 'availableTokens']),
    ...mapGetters('fungibleTokens', ['tokenBalances']),
    fungibleToken() {
      return this.availableTokens[this.id];
    },
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
          ...this.fungibleToken,
          contract: this.id,
        }
      );
    },
  },
  mounted() {
    this.$store.commit('setPageTitle', this.fungibleToken ? this.fungibleToken.name : 'Aeternity');
  },
  destroyed() {
    this.$store.commit('setPageTitle', '');
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

::v-deep {
  text-align: left;
}

.token-header {
  background-color: variables.$color-black;
  padding: 20px 30px;
}

.token-profile {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;

  .token-amount {
    font-size: 18px;
    margin-left: 10px;

    ::v-deep .fiat {
      display: block;
      font-size: 16px;
    }
  }
}

.token-actions {
  display: flex;
  align-items: center;

  .button {
    width: auto;
    padding: 0 25px;
    display: inline-block;
  }
}

.section-title {
  color: variables.$color-light-grey;
  font-weight: 500;
  font-size: 15px;
  padding: 12px 15px;
  background-color: variables.$color-bg-3;
}

.token-info > div:nth-child(odd) {
  background-color: variables.$color-bg-3;
}

.contract ::v-deep .text,
.community ::v-deep .text {
  color: variables.$color-green;
}

.contract ::v-deep .text {
  font-size: 9px;
  display: flex;
  align-items: center;
}

.community ::v-deep .text {
  font-size: 13px;
}
</style>
