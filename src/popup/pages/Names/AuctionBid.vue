<template>
  <div class="auction-bid">
    <AuctionCard :name="name" />

    <div class="form">
      <InputAmount
        v-model="amount"
        :error="!!amountError"
        :message="amountError"
        @error="(val) => error = val"
      />
      <div class="tx-details">
        <DetailsItem :label="$t('transaction.fee')">
          <template #value>
            <TokenAmount
              :amount="+txFee"
              hide-fiat
            />
          </template>
        </DetailsItem>
        <DetailsItem :label="$t('total')">
          <template #value>
            <TokenAmount
              :amount="+amountTotal"
            />
          </template>
        </DetailsItem>
      </div>

      <BtnMain
        :disabled="!!amountError || error || !amount"
        class="button"
        extend
        @click="bid"
      >
        {{ $t('pages.names.auctions.place-bid') }}
      </BtnMain>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent, ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IAuctionBid } from '../../../types';
import { useSdk } from '../../../composables';
import { useGetter } from '../../../composables/vuex';
import {
  AENS_BID_MIN_RATIO,
  MODAL_DEFAULT,
  aeToAettos,
  calculateNameClaimFee,
} from '../../utils';

import AuctionCard from '../../components/AuctionCard.vue';
import InputAmount from '../../components/InputAmount.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';

export default defineComponent({
  name: 'AuctionBid',
  components: {
    AuctionCard,
    InputAmount,
    DetailsItem,
    TokenAmount,
    BtnMain,
  },
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();

    const { getSdk } = useSdk({ store });

    const loading = ref(false);
    const amount = ref('');
    const error = ref(false);

    // eslint-disable-next-line no-unused-vars
    const getHighestBid = useGetter<(n: string) => IAuctionBid | null>('names/getHighestBid');

    const highestBid = computed(() => getHighestBid.value(props.name)?.nameFee || new BigNumber(0));
    const txFee = computed<BigNumber>(() => calculateNameClaimFee(props.name));
    const amountTotal = computed(() => txFee.value.plus(amount.value || 0));
    const amountError = computed(() => {
      const minBid = highestBid.value.multipliedBy(AENS_BID_MIN_RATIO);
      return (amount.value !== '' && minBid.isGreaterThanOrEqualTo(+amount.value))
        ? t('pages.names.auctions.min-bid', { minBid })
        : null;
    });

    async function bid() {
      const sdk = await getSdk();
      if (amountError.value) return;
      try {
        loading.value = true;
        await sdk.aensBid(props.name, aeToAettos(amount.value));
        store.dispatch('modals/open', {
          name: MODAL_DEFAULT,
          msg: t('pages.names.auctions.bid-added', { name: props.name }),
        });
        router.push({ name: 'auction-history', params: { name: props.name } });
      } catch (e: any) {
        let msg = e.message;
        if (msg.includes('is not enough to execute')) {
          msg = t('pages.names.balance-error');
        }
        store.dispatch('modals/open', { name: MODAL_DEFAULT, msg });
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      amount,
      amountTotal,
      amountError,
      error,
      txFee,
      bid,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.auction-bid {
  .form {
    padding: 16px;

    .tx-details {
      display: flex;
      padding-top: 16px;

      .details-item {
        margin-right: 24px;
      }
    }

    .button {
      margin-top: 16px;
    }
  }
}
</style>
