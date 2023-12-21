<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="token-details">
        <DetailsRow
          v-if="assetData?.symbol"
          :label="isAssetCoin ? $t('pages.token-details.coin') : $t('pages.token-details.token')"
          :text="assetData?.symbol"
        >
          <template #text>
            <Tokens
              v-if="tokens"
              class="token-details-tokens"
              :tokens="tokens"
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
          v-if="assetData?.contractId && !isAssetCoin"
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
import type { IAsset } from '@/types';
import {
  PROTOCOLS,
  UNFINISHED_FEATURES,
} from '@/constants';
import {
  amountRounded,
  formatNumber,
  isCoin,
  toShiftedBigNumber,
} from '@/utils';
import { useAssetDetails, useCurrencies } from '@/composables';

import DetailsRow from '@/popup/components/Assets/DetailsRow.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import Tokens from '@/popup/components/Tokens.vue';

export default defineComponent({
  name: 'AssetDetailsInfo',
  components: {
    DetailsRow,
    AddressTruncated,
    Tokens,
    IonPage,
    IonContent,
  },

  setup() {
    const { sharedAssetDetails } = useAssetDetails();
    const { formatCurrency } = useCurrencies();

    const assetData = computed((): IAsset => sharedAssetDetails.value.tokenData || {});
    const assetContractId = computed(() => assetData.value.contractId);
    const tokens = computed(() => sharedAssetDetails.value.tokens);
    const tokenPairs = computed(() => sharedAssetDetails.value.tokenPairs);
    const tokenBalance = computed(() => sharedAssetDetails.value.tokenBalance);
    const isAssetCoin = computed(() => isCoin(assetContractId.value));
    const decimals = computed(() => assetData.value?.decimals || tokenBalance.value?.decimals);

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
      isAssetCoin,
      poolShare,
      getPooledTokenAmount,
      formatCurrency,
      formatNumber,
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
@use '../../../styles/typography';
@use '../../../styles/variables';

.token-details {
  margin-top: 10px;

  .price {
    .green {
      color: variables.$color-success;
      font-weight: 400;
    }

    .red {
      color: variables.$color-danger;
      font-weight: 400;
    }
  }

  .link a {
    color: variables.$color-grey-light;
    text-decoration: none;
    display: inline-flex;
    align-items: center;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .address-shortening {
    color: variables.$color-grey-light;

    &:hover {
      color: variables.$color-white;
    }
  }

  .token-details-tokens {
    @extend %face-sans-15-medium;

    color: variables.$color-white;
  }
}
</style>