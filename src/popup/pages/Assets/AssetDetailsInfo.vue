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
          v-if="assetData.decimals"
          :label="$t('pages.token-details.decimals')"
          :text="assetData.decimals"
        />

        <DetailsRow
          v-if="assetData?.contractId && !isCoin"
          :label="$t('pages.token-details.smartContract')"
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
          v-if="assetData.ownerAddress"
          :label="$t('pages.token-details.ownerAddress')"
        >
          <template #text>
            <AddressTruncated
              show-explorer-link
              :protocol="assetData.protocol"
              :address="assetData.ownerAddress"
            />
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="assetData.saleAddress"
          :label="$t('pages.token-details.saleAddress')"
        >
          <template #text>
            <AddressTruncated
              show-explorer-link
              :protocol="assetData.protocol"
              :address="assetData.saleAddress"
            />
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="assetData.creatorAddress"
          :label="$t('pages.token-details.creatorAddress')"
        >
          <template #text>
            <AddressTruncated
              show-explorer-link
              :protocol="assetData.protocol"
              :address="assetData.creatorAddress"
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
          v-if="assetData.price"
          :label="$t('pages.token-details.price')"
        >
          <template #text>
            <TokenAmount
              :amount="assetData.price"
              :protocol="assetData.protocol"
              high-precision
            />
          </template>
        </DetailsRow>

        <DetailsRow
          v-if="assetData?.marketCap"
          :label="$t('pages.token-details.market-cap')"
          class="price"
        >
          <template #text>
            <TokenAmount
              v-if="!isCoin"
              :amount="assetData.marketCap"
              :protocol="assetData.protocol"
            />
            <span v-else>{{ formatCurrency(assetData.marketCap) }}</span>
          </template>
        </DetailsRow>

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

        <DetailsRow
          v-if="assetData.daoBalance"
          :label="$t('pages.token-details.daoBalance')"
        >
          <template #text>
            <TokenAmount
              :amount="assetData.daoBalance"
              :protocol="assetData.protocol"
              high-precision
            />
          </template>
        </DetailsRow>

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

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  amountRounded,
  formatNumber,
  isAssetCoin,
  toShiftedBigNumber,
} from '@/utils';
import { useAssetDetails, useCurrencies } from '@/composables';
import { PROTOCOLS } from '@/constants';
import { useAeTokenSales } from '@/protocols/aeternity/composables/aeTokenSales';

import DetailsRow from '@/popup/components/Assets/DetailsRow.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import Tokens from '@/popup/components/Tokens.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';

export default defineComponent({
  name: 'AssetDetailsInfo',
  components: {
    DetailsRow,
    AddressTruncated,
    Tokens,
    IonPage,
    IonContent,
    LinkButton,
    TokenAmount,
  },

  setup() {
    const { sharedAssetDetails } = useAssetDetails();
    const { formatCurrency } = useCurrencies();
    const { tokenSales } = useAeTokenSales();

    const tokenSaleInfo = computed(() => (
      sharedAssetDetails.tokenData.protocol === PROTOCOLS.aeternity
        ? tokenSales.value
          .find((token) => token.address === sharedAssetDetails.tokenData.contractId)
        : undefined
    ));

    const adapter = computed(() => ProtocolAdapterFactory.getAdapter(
      sharedAssetDetails.tokenData.protocol,
    ));

    const assetData = computed(() => ({
      ...sharedAssetDetails.tokenData,
      ...sharedAssetDetails.tokenBalance,
      ...(tokenSaleInfo.value ? {
        totalSupply: tokenSaleInfo.value?.totalSupply
          ? +toShiftedBigNumber(
            tokenSaleInfo.value.totalSupply,
            -sharedAssetDetails.tokenData.decimals,
          )
          : undefined,
        marketCap: tokenSaleInfo.value?.marketCap
          ? +toShiftedBigNumber(tokenSaleInfo.value.marketCap, -adapter.value.coinPrecision)
          : undefined,
        creatorAddress: tokenSaleInfo.value?.creatorAddress,
        ownerAddress: tokenSaleInfo.value?.ownerAddress,
        saleAddress: tokenSaleInfo.value?.saleAddress,
        daoBalance: tokenSaleInfo.value?.daoBalance
          ? +toShiftedBigNumber(tokenSaleInfo.value?.daoBalance, -adapter.value.coinPrecision)
          : undefined,
      }
        : {}
      ),
    }));
    const tokens = computed(() => sharedAssetDetails.tokens);
    const tokenPairs = computed(() => sharedAssetDetails.tokenPairs || {});
    const isCoin = computed(() => isAssetCoin(assetData.value.contractId));
    const coinGeckoLinkUrl = computed(() => `https://www.coingecko.com/en/coins/${adapter.value.getCoinGeckoCoinId()}`);
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
      assetData,
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
