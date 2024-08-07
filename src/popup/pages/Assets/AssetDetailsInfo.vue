<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="token-details">
        <DetailsRow
          v-if="assetData?.symbol"
          :label="isCoin ? $t('pages.token-details.coin') : $t('pages.token-details.token')"
          :text="assetData?.symbol"
        >
          <template #text>
            <Tokens
              v-if="tokens"
              class="token-details-tokens"
              :tokens="tokens"
              bright
            />
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="assetData?.name"
          :label="$t('pages.token-details.name')"
          :text="assetData.name"
        />

        <DetailsRow
          v-if="decimals"
          :label="$t('pages.token-details.decimals')"
          :text="decimals"
        />

        <DetailsRow
          v-if="assetData?.contractId && !isCoin"
          :label="$t('common.smartContract')"
        >
          <template #text>
            <AddressTruncated
              show-explorer-link
              :protocol="assetData.protocol"
              :address="assetData.contractId"
            />
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="assetData?.circulatingSupply"
          :label="$t('pages.token-details.max-supply')"
          :text="formatNumber(assetData.circulatingSupply)"
        />

        <DetailsRow
          v-if="assetData?.totalSupply"
          :label="$t('pages.token-details.total-supply')"
          :text="formatNumber(assetData.totalSupply)"
        />

        <DetailsRow
          v-if="assetData?.marketCap"
          :label="$t('pages.token-details.market-cap')"
          class="price"
          :text="formatCurrency(assetData.marketCap)"
        />

        <DetailsRow
          v-if="tokenPairs.balances"
          :label="$t('pages.token-details.holders')"
          :text="tokenPairs.balances.size"
        />

        <DetailsRow
          v-if="tokenPairs.token0 && tokenPairs.token0.amount > 0"
          :text="getPooledTokenAmount(tokenPairs.token0)"
        >
          <template #label>
            {{ $t('pages.token-details.pooled') }}
            <span class="white">{{ tokenPairs.token0.symbol }}</span>
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="tokenPairs.token1 && tokenPairs.token1.amount > 0"
          :text="getPooledTokenAmount(tokenPairs.token1)"
        >
          <template #label>
            {{ $t('pages.token-details.pooled') }}
            <span class="white">{{ tokenPairs.token1.symbol }}</span>
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="poolShare"
          :label="$t('pages.token-details.poolShare')"
          :text="poolShare"
        />

        <DetailsRow
          v-if="assetData?.totalVolume"
          :label="$t('pages.token-details.volume')"
          :text="formatCurrency(assetData.totalVolume)"
        />

        <DetailsRow
          v-if="assetData?.marketCapChange24h"
          class="price"
          :label="$t('pages.token-details.volumeDaily')"
        >
          <template #text>
            <span
              :class="{
                green: assetData?.marketCapChangePercentage24h > 0,
                red: assetData?.marketCapChangePercentage24h < 0,
              }"
            >
              {{ Number(assetData.marketCapChangePercentage24h).toFixed(2) }}%
            </span>
            {{ formatCurrency(assetData?.marketCapChange24h) }}
          </template>
        </DetailsRow>

        <!--
          TODO decide if we still need this
        -->
        <template v-if="UNFINISHED_FEATURES">
          <DetailsRow
            :label="$t('pages.token-details.transactions')"
          />

          <DetailsRow
            :label="$t('pages.token-details.feeDaily')"
          />

          <DetailsRow
            :label="$t('pages.token-details.priceAe')"
          />
        </template>

        <DetailsRow
          v-if="assetData?.currentPrice"
          class="price"
          :label="$t('pages.token-details.price')"
        >
          <template #text>
            <span
              :class="{
                green: assetData.priceChangePercentage24h > 0,
                red: assetData.priceChangePercentage24h < 0,
              }"
            >
              {{ Number(assetData.priceChangePercentage24h).toFixed(2) }}%
            </span>
            {{ formatCurrency(assetData.currentPrice) }}
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="assetData?.ath"
          :label="$t('pages.token-details.ath-change')"
          :text="formatCurrency(assetData.ath)"
        />

        <DetailsRow
          v-if="assetData?.atl"
          :label="$t('pages.token-details.atl-change')"
          :text="formatCurrency(assetData.atl)"
        />

        <DetailsRow
          v-if="isCoin"
          class="link"
          :label="$t('pages.token-details.more')"
        >
          <template #text>
            <LinkButton
              :text="coinGeckoLinkLabel"
              :href="coinGeckoLinkUrl"
              variant="muted"
              is-external
            />
          </template>
        </DetailsRow>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from 'vue';
import BigNumber from 'bignumber.js';
import { IonContent, IonPage } from '@ionic/vue';
import {
  PROTOCOLS,
  UNFINISHED_FEATURES,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  amountRounded,
  formatNumber,
  isAssetCoin,
  toShiftedBigNumber,
} from '@/utils';
import { useAssetDetails, useCurrencies } from '@/composables';

import DetailsRow from '@/popup/components/Assets/DetailsRow.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import Tokens from '@/popup/components/Tokens.vue';
import LinkButton from '@/popup/components/LinkButton.vue';

export default defineComponent({
  name: 'AssetDetailsInfo',
  components: {
    DetailsRow,
    AddressTruncated,
    Tokens,
    IonPage,
    IonContent,
    LinkButton,
  },

  setup() {
    const { sharedAssetDetails } = useAssetDetails();
    const { formatCurrency } = useCurrencies();

    const assetData = computed(() => sharedAssetDetails.tokenData || {});
    const adapter = computed(() => ProtocolAdapterFactory.getAdapter(assetData.value?.protocol));
    const assetContractId = computed(() => assetData.value.contractId);
    const tokens = computed(() => sharedAssetDetails.tokens);
    const tokenPairs = computed(() => sharedAssetDetails.tokenPairs || {});
    const tokenBalance = computed(() => sharedAssetDetails.tokenBalance);
    const isCoin = computed(() => isAssetCoin(assetContractId.value));
    const decimals = computed(() => assetData.value?.decimals || tokenBalance.value?.decimals);
    const coinGeckoLinkUrl = computed(() => `https://www.coingecko.com/en/coins/${adapter.value.coinGeckoCoinId}`);
    const coinGeckoLinkLabel = computed(() => coinGeckoLinkUrl.value.replace('https://', '').replace('en/coins', '...'));

    const poolShare = computed(() => {
      if (!tokenPairs.value?.balance || !tokenPairs.value?.totalSupply) {
        return null;
      }
      return `${amountRounded((new BigNumber(tokenPairs.value.balance))
        .times(100).div(tokenPairs.value.totalSupply))}%`;
    });

    const getPooledTokenAmount = (token: any) => amountRounded(
      toShiftedBigNumber(token.amount, -token.decimals),
    );

    return {
      PROTOCOLS,
      UNFINISHED_FEATURES,
      isCoin,
      poolShare,
      getPooledTokenAmount,
      formatCurrency,
      formatNumber,
      sharedAssetDetails,
      coinGeckoLinkUrl,
      coinGeckoLinkLabel,
      tokens,
      tokenPairs,
      tokenBalance,
      assetData,
      decimals,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.token-details {
  margin-top: 10px;

  .price {
    .green {
      color: $color-success;
      font-weight: 400;
    }

    .red {
      color: $color-danger;
      font-weight: 400;
    }
  }

  .link a {
    color: $color-grey-light;
    text-decoration: none;
    display: inline-flex;
    align-items: center;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .address-shortening {
    color: $color-grey-light;

    &:hover {
      color: $color-white;
    }
  }
}
</style>
