<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div class="token-details">
        <DetailsRow
          v-if="tokenData?.symbol"
          :label="isAe ? $t('pages.token-details.coin') : $t('pages.token-details.token')"
          :text="tokenData?.symbol"
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
          v-if="tokenData?.decimals"
          :label="$t('pages.token-details.decimals')"
          :text="tokenData.decimals"
        />
        <DetailsRow
          v-if="tokenData?.contractId && !isAe"
          :label="$t('common.smartContract')"
        >
          <template #text>
            <AddressTruncated
              show-explorer-link
              :address="tokenData.contractId"
            />
          </template>
        </DetailsRow>
        <DetailsRow
          v-if="tokenData?.circulatingSupply"
          :label="$t('pages.token-details.max-supply')"
          :text="formatNumber(tokenData.circulatingSupply)"
        />
        <DetailsRow
          v-if="tokenData?.totalSupply"
          :label="$t('pages.token-details.total-supply')"
          :text="formatNumber(tokenData.totalSupply)"
        />
        <DetailsRow
          v-if="tokenData?.marketCap"
          :label="$t('pages.token-details.market-cap')"
          class="price"
          :text="formatCurrency(tokenData.marketCap)"
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
          v-if="!isAe && UNFINISHED_FEATURES"
          :label="$t('pages.token-details.transactions')"
        />

        <DetailsRow
          v-if="tokenData?.totalVolume"
          :label="$t('pages.token-details.volume')"
          :text="formatCurrency(tokenData.totalVolume)"
        />
        <DetailsRow
          v-if="tokenData?.marketCapChange24h"
          class="price"
          :label="$t('pages.token-details.volumeDaily')"
        >
          <template #text>
            <span
              :class="{
                green: tokenData?.marketCapChangePercentage24h > 0,
                red: tokenData?.marketCapChangePercentage24h < 0,
              }"
            >
              {{ Number(tokenData.marketCapChangePercentage24h).toFixed(2) }}%
            </span>
            {{ formatCurrency(tokenData?.marketCapChange24h) }}
          </template>
        </DetailsRow>
        <DetailsRow
          v-if="!isAe && UNFINISHED_FEATURES"
          :label="$t('pages.token-details.feeDaily')"
        />

        <DetailsRow
          v-if="!isAe"
          class="link"
          :label="$t('pages.token-details.chart')"
        >
          <template #text>
            <LinkButton
              :to="AE_DEX_URL"
            >
              {{ displayDexUrl }}
              <ExternalLink />
            </LinkButton>
          </template>
        </DetailsRow>
        <DetailsRow
          v-if="!isAe && UNFINISHED_FEATURES"
          :label="$t('pages.token-details.price-ae')"
        />
        <DetailsRow
          v-if="tokenData?.currentPrice"
          class="price"
          :label="$t('pages.token-details.price')"
        >
          <template #text>
            <span
              :class="{
                green: tokenData.priceChangePercentage24h > 0,
                red: tokenData.priceChangePercentage24h < 0,
              }"
            >
              {{ Number(tokenData.priceChangePercentage24h).toFixed(2) }}%
            </span>
            {{ formatCurrency(tokenData.currentPrice) }}
          </template>
        </DetailsRow>
        <DetailsRow
          v-if="tokenData?.ath"
          :label="$t('pages.token-details.ath-change')"
          :text="formatCurrency(tokenData.ath)"
        />
        <DetailsRow
          v-if="tokenData?.atl"
          :label="$t('pages.token-details.atl-change')"
          :text="formatCurrency(tokenData.atl)"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';
import { IonContent, IonPage } from '@ionic/vue';
import { UNFINISHED_FEATURES } from '@/constants';
import {
  amountRounded,
  formatNumber,
  toShiftedBigNumber,
} from '@/utils';
import { useCurrencies, useTokenProps } from '@/composables';
import { AE_CONTRACT_ID, AE_DEX_URL } from '@/protocols/aeternity/config';

import LinkButton from '@/popup/components/LinkButton.vue';
import DetailsRow from '../../components/FungibleTokens/DetailsRow.vue';
import AddressTruncated from '../../components/AddressTruncated.vue';
import Tokens from '../../components/Tokens.vue';
import ExternalLink from '../../../icons/external-link.svg?vue-component';

export default defineComponent({
  name: 'TokenDetails',
  components: {
    DetailsRow,
    AddressTruncated,
    Tokens,
    ExternalLink,
    LinkButton,
    IonPage,
    IonContent,
  },

  setup() {
    const store = useStore();
    const { tokenDetails } = useTokenProps();
    const {
      tokenData, contractId, tokens, tokenPairs,
    } = tokenDetails.value;
    const { formatCurrency } = useCurrencies({ store });

    const displayDexUrl = AE_DEX_URL.replace('https://', '');

    const isAe = computed(() => tokenData.contractId === AE_CONTRACT_ID);

    const poolShare = computed(() => {
      if (!tokenPairs
      || !tokenPairs.balance
      || !tokenPairs.totalSupply) {
        return null;
      }
      return `${amountRounded((new BigNumber(tokenPairs.balance))
        .times(100).div(tokenPairs.totalSupply))}%`;
    });

    const getPooledTokenAmount = (token: any) => amountRounded(
      toShiftedBigNumber(token.amount, -token.decimals),
    );

    return {
      AE_DEX_URL,
      UNFINISHED_FEATURES,
      displayDexUrl,
      isAe,
      poolShare,
      getPooledTokenAmount,
      formatCurrency,
      formatNumber,
      contractId,
      tokens,
      tokenPairs,
      tokenData,
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
