<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="auction-bid">
        <AuctionCard :name="name" />

        <div class="form">
          <InputAmount
            v-model="amount"
            :error="!!amountError"
            :message="amountError"
            ae-only
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
            <DetailsItem :label="$t('common.total')">
              <template #value>
                <TokenAmount
                  :amount="+amountTotal"
                />
              </template>
            </DetailsItem>
          </div>

          <BtnMain
            :disabled="!!amountError || !amount"
            class="button"
            extend
            @click="bid"
          >
            {{ $t('pages.names.auctions.place-bid') }}
          </BtnMain>
        </div>
        <Loader v-if="loading" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { computed, defineComponent, ref } from 'vue';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IAuctionBid } from '../../../types';
import { useModals, useSdk } from '../../../composables';
import { useGetter } from '../../../composables/vuex';
import {
  AENS_BID_MIN_RATIO,
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
    IonPage,
    IonContent,
  },
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();

    const { getSdk } = useSdk({ store });
    const { openDefaultModal } = useModals();

    const loading = ref(false);
    const amount = ref('');

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
        openDefaultModal({
          msg: t('pages.names.auctions.bid-added', { name: props.name }),
        });
        router.push({ name: 'auction-history', params: { name: props.name } });
      } catch (error: any) {
        let msg = error.message;
        if (msg.includes('is not enough to execute')) {
          msg = t('pages.names.balance-error');
        }
        openDefaultModal({ msg });
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      amount,
      amountTotal,
      amountError,
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
